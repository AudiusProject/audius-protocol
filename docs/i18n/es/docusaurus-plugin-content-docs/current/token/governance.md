# Gobernanza

## Cómo funciona la Gobernanza de Audius

La Gobernanza es el proceso mediante el cual los titulares de fichas AUDIO realizan cambios en Audius a través de propuestas en cadena.

Permite a la comunidad dar forma directa a las futuras iteraciones de la plataforma y es el principio básico que impulsa la infraestructura descentralizada de Audius.


En esta publicación, cubriremos cómo funciona la gobernanza en Audius, y lo que puedes hacer como titular de AUDIO para participar.


### **Portal de gobernanza**

La única fuente de verdad para la gobernanza de Audius se puede encontrar en el panel de control de protocolos en la pestaña [Gobernanza](https://dashboard.audius.org/governance).


Aquí puede ver una lista de todas las propuestas activas y resueltas en orden cronológico junto con si han pasado o han fracasado.


Cada propuesta de gobernanza incluye un desglose de los siguientes parámetros:


* _Proponedor_ - La dirección responsable del envío de la propuesta
* _Descripción_ - Una síntesis rápida de lo que la propuesta de gobernanza implica
* _Por_ - La cantidad de votos a favor de la propuesta
* _Contra_ - La cantidad de votos en contra de la propuesta

**Todas las propuestas están sujetas al 5% del quórum $AUDIO en stake y a la mayoría del 50%.**


Esto significa que para que una propuesta se apruebe, por lo menos el 5% de todos los $AUDIO en stake deben votar en la propuesta y más del 50% de los votos deben ser "a favor" de la propuesta.


Hoy en día, sólo quienes tienen un nodo pueden hacer una propuesta en cadena. En el futuro, el conjunto de proponentes permitidos podría ampliarse de cualquier forma que la comunidad considere oportuna.


### **Proceso de gobernanza**

La gobernanza efectiva es mucho más que la votación de propuestas en cadena y algo que queremos hacer aún más accesible en Audius.


Aquí hay un desglose del ecosistema de gobernanza en evolución de Audius, incluyendo las herramientas, procesos y logística detrás de la votación de AUDIO.


_Comentarios de Discord &gt; Comentarios del foro &gt; Enviar al Portal de gobernanza &gt; Voto en cadena &gt; Ejecutar_


Por favor, ten en cuenta que algunos usuarios pueden estar más inclinados que otros a facilitar la duración de este proceso, y recomendamos que cualquier persona interesada en dar forma a Audius contribuya de cualquier forma posible, ¡incluso si eso significa comenzar una conversación alrededor de un tema en Discord!


#### **Gobernanza en Discord**

En el Discord [AUDIOphile](https://discord.gg/ah5CcqW), notarás un canal llamado \#governance. Aquí es donde las primeras iteraciones y las ideas de propuestas pueden ser enviadas para su opinión comunitaria.


No es necesario obtener comentarios sobre una propuesta en Discord pero una gran manera de tener una sensación general de si un tema vale la pena o no desarrollar en detalle antes de presentarse en el foro para una discusión más formal.


Los temas de gobernanza pueden ser vistos como un medio de señalización, donde los proponentes reciben comentarios de muy alto nivel de otros miembros de la comunidad para ver si sus ideas serán o no bien recibidas en principio.


#### **Audius Forum**

El [Foro de Gobernanza](https://gov.audius.org/) de Audius es el lugar principal para discutir detalles en profundidad sobre las propuestas.


Se recomienda que todas las propuestas cubran los siguientes temas:


* _Título_ - ¿De qué trata esta propuesta?
* _Resumen_ - ¿Cuál es una breve explicación / EIL5 de esta propuesta?
* _Resúmenes_ - ¿Qué se hará si se implementa esta propuesta? ¿Qué contexto e información adicional puede ofrecer?
* _Motivación_ - ¿Cuál es el razonamiento detrás de por qué esta propuesta y su beneficio para Audius?
* _Especificación_ - ¿Qué significa votar a favor o en contra de esta propuesta?
* _Encuesta_ - ¿Votaría a favor o en contra de esta propuesta?

Mientras que en su infancia, el foro de gobernanza de Audius es el mejor lugar para formalizar los pensamientos antes de someterlo a votación en cadena.

Las votaciones en cadena requieren mucha señal y coordinación, para que el foro de gobernanza ofrezca una buena manera de finalizar los detalles más finos de una propuesta antes de colocarla en cadena para un voto comunitario.


#### **Portal de gobernanza**

Después de recibir comentarios, los operadores de nodos pueden presentar esa propuesta en cadena a través del portal de gobernanza.

Tenga en cuenta que el poder de propuesta está correlacionado con la cantidad de AUDIO en stake o delegado para la seguridad de la red es decir, los operadores de nodos son los principales candidatos para las propuestas en cadena.

Puede encontrar una lista de todas las propuestas en cadena [aquí](https://dashboard.audius.org/#/governance).


Los detalles de la propuesta deben mapear las especificaciones esbozadas en el post del foro, incluyendo detalles e implementaciones en torno a cualquier cambio técnico necesario para la implementación de la propuesta.


#### **Votación en cadena**

Usando la [propuesta de gobernanza más reciente](https://dashboard.audius.org/#/governance/proposal/9) de Figmento como ejemplo puede ver que diferentes operadores de nodos y delegadores votaron a favor de ampliar el tiempo de votación de 48 a 72 horas.


![](https://assets.website-files.com/6024b69839b1b7fd3787991c/607d16049feb3a126f852b57_H6OK09A-2szawbI66mlGi7489J5aj-x604boPIeDUs6zhfZB7Fs77rIsaskaMGslMNWdGrTfm2ZM_sLalkwBvLCn-I0aUm7g9aSIYr11qC0b2t5WHELcyUtSlK21OaD5UgB9mnRN.png)


Dado que el número total de votos \(1 AUDIO, 1 voto\) estaba por encima del requisito de quórum de ~11M $AUDIO y la mayoría del 50% \(100% votó a favor\) ¡la propuesta ha aprobado!


Al hacerlo, los cambios [de esta propuesta](https://etherscan.io/tx/0xd4e14895b2a22b48469a43923ab7b30bee75f9a688941933430b3dae9510b8a6) fueron [ejecutados a través del contrato de gobernanza](https://etherscan.io/tx/0x4396652fb9c1116cec5900f412608dfba7a3ec1b9967f4109a8ec3e09d3a75af), cambiando la ventana de votación de 48 horas a 72 horas!


#### **Multifirma de la comunidad**

Una vez que se ha aprobado una votación, el contrato de gobernanza ejecuta la propuesta.


Sin embargo, Audius también cuenta con un multisig de la comunidad como veto de último recurso, al que se hace referencia en el whitepaper en la subsección "cortocircuito" de la sección de gobernanza.


Esto significa que un conjunto de 9 miembros de la comunidad de Audius tienen la capacidad de impedir que se apruebe una propuesta maliciosa. En el caso de que se utilice el multisig, 6 de los 9 firmantes deberán firmar una transacción para anular la propuesta.


A medida que Audius siga madurando, la comunidad puede en cualquier momento votar para eliminar esta capacidad de veto del sistema también.


Más detalles sobre los firmantes de este multifirma así como la intención de su uso serán compartidos en una futura entrada del blog.


### **Gobernanza evolutiva**

La gobernanza de Audius es un proceso que evoluciona para dar a todos los titulares de $AUDIO una voz de futuras iteraciones de la plataforma.


El proceso detallado arriba probablemente cambie en línea con las nuevas herramientas, actualizaciones de productos y onramps para permitir a todos los usuarios de tokens revisar y participar fácilmente en las decisiones de gobernanza, independientemente de sus conocimientos técnicos.


Estamos encantados de compartir más detalles acerca de la gobernanza en un futuro próximo y esperamos construir el protocolo de streaming propiedad de la comunidad que es Audius!
