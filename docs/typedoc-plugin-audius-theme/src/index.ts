import {
  Application,
  RendererEvent,
  EventCallback,
  ReflectionKind,
  DeclarationReflection,
  Reflection,
  Converter,
  Context
} from "typedoc";
import * as examples from "./examples";

export function load(app: Application) {
  const onRenderBegin: EventCallback = (event: RendererEvent) => {
    // For each of the classes
    const classes = event.project.getReflectionsByKind(
      ReflectionKind.Class
    ) as DeclarationReflection[];

    classes.forEach((r: DeclarationReflection) => {
      // Remove the Hierarchy display
      delete r.typeHierarchy;

      // Update the name
      r.name = r.name.replace("Api", "");

      // Hide the Kind display
      r.kindString = "";

      // Delete everything but methods
      r.groups = r.groups?.filter((g) => {
        const kindsToDelete = [
          ReflectionKind.Property,
          ReflectionKind.Constructor,
        ];
        const result = !kindsToDelete.includes(g.kind);
        return result;
      });

      r.children?.forEach((c) => {
        delete r.parent;
        if (c.kind === ReflectionKind.Method) {
          // Find the corresponding example in the `examples` directory
          const example = (examples as any)[r.name.toLowerCase()]?.[c.name];

          // Add the example to the comment
          if (c.signatures?.[0].comment && example) {
            c.signatures[0].comment.text = `Example:\n\n\`\`\`typescript\n${example}\n\`\`\``;
          }

          // Fix escaping of single quotes in short text description
          if (c.signatures?.[0].comment?.shortText) {
            c.signatures[0].comment.shortText =
              c.signatures?.[0].comment?.shortText.replace("\\'", "'");
          }
        }
      });
    });
  };

  const onConverterEnd: EventCallback = (context: Context) => {
    const reflections = context.project.getReflectionsByKind(
      ReflectionKind.All
    ) as DeclarationReflection[];

    reflections.forEach((r: Reflection) => {
      // Remove full namespace entirely
      if (r.getFullName().startsWith('full.')) {
        context.project.removeReflection(r)
      }
    });
  };

  app.renderer.on(RendererEvent.BEGIN, onRenderBegin);
  app.converter.on(Converter.EVENT_END, onConverterEnd);
}
