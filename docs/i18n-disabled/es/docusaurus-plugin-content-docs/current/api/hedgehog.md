---
sidebar_label: Hedgehog
sidebar_position: 2
---

# Hedgehog

Construir DApps como Apps

[Github](https://github.com/AudiusProject/hedgehog) 👈

Hedgehog es una cartera Ethereum de código abierto que utiliza un nombre de usuario y una contraseña. Su objetivo es reducir la barrera de entrada a proyectos cripto para usuarios no expertos en tecnología.

Permite a los usuarios interactuar con tu DApp como lo harían con cualquier otro sitio web, sin necesidad de extensiones, sin centralizar el control de claves.

**Hedgehog** es una alternativa a Metamask que administra la clave privada y la billetera de un usuario en el navegador. Expone una sencilla API que permite crear un esquema de autenticación para que los usuarios se registren e inicien sesión en su billetera a través de múltiples navegadores y dispositivos.

### No todas las transacciones son iguales

Las billeteras de Ethereum actuales tratan cada transacción como si estuviera moviendo los ahorros de su vida. Hedgehog se construyó para casos de uso que implican un valor financiero bajo o nulo.

> Nota: La mejora principal de la experiencia del usuario final se consigue ocultando la complejidad de la cartera y no obligando a los usuarios a confirmar las transacciones - lo contrario de lo que desearías cuando se mueve dinero significativo.

#### No hay más ventanas emergentes 🦊

Hoy en día, las aplicaciones descentralizadas requieren de muchos conocimientos técnicos para configurar y usar, limitar su base de usuarios y reducir el potencial de crecimiento.

### Instalación

```bash
npm i --save @audius/hedgehog
```

### Documentos & Ejemplos

Echa un vistazo a nuestros documentos técnicos [](http://audiusproject.github.io/hedgehog-docs) y [api how to](http://audiusproject.github.io/hedgehog-docs#how-to).

Para una demostración rápida del lado del navegador, [no busque más](https://codesandbox.io/embed/pp9zzv2n00). Para una demostración completa de autenticación de extremo a extremo, vea nuestra [demo repo](https://github.com/AudiusProject/audius-hedgehog-demo).

### ¿Por qué utilizarlo?

#### No todas las transacciones son iguales

Las billeteras disponibles actualmente tratan cada transacción como si estuviera moviendo los ahorros de su vida. Hedgehog se construyó para casos de uso que implican un valor financiero bajo o nulo.

**NOTA**: La principal mejora de la experiencia del usuario final es ocultando la complejidad de la billetera y no obligando a los usuarios a confirmar constantemente las transacciones - lo contrario de lo que quieres cuando se mueve dinero significativo.

#### ¿Es Hedgehog adecuado para tu DApp?

Hedgehog no es correcto para cada DApp. Las mejoras masivas en la experiencia del usuario sólo son posibles a través de las compensaciones. Como regla general, Hedgehog no debe ser utilizado para aplicaciones que impliquen sumas significativas de dinero. Como puente, se podría iniciar usuarios en Hedgehog y sugerir migrar a una cartera más segura si su valor almacenado aumenta más allá de un determinado umbral; el paradigm de Hedgehog es interoperable también con los proveedores web existentes.

_\[Buenos casos de uso\]_

* **Firmando datos**: Si está construyendo aplicaciones descentralizadas que dependen de los datos firmados por el usuario \(ej. via EIP-712-esque signing schemes\), Hedgehog podría ayudar a simplificar la experiencia si lo que está en stakes es lo suficientemente bajo.
* **Gaming DApp**: Nada arruina tanto la diversión como firmar transacciones. Si estás construyendo un DApp de juego que no utiliza activos financieros significativos, mejorar la UX es clave.
* **Reproductor de música descentralizado**: Si estás construyendo DApps orientadas al consumidor, Hedgehog mejorará espectacularmente la experiencia del usuario y aumentará significativamente tu base de usuarios potencial.

_\[Casos de uso incorrecto\]_

Si tu DApp involucra desplazarse alrededor de cantidades significativas de dinero, es muy probable que la compensación en seguridad no valga la pena. La principal mejora de Hedgehog a la experiencia del usuario final es ocultando la cartera y no obligando a los usuarios a confirmar las transacciones - Lo contrario de lo que querrías al mover el dinero. No recomendamos en absoluto usar Hedgehog en situaciones como estas:

* **DApp de Banca**
* **Préstamos descentralizados**
* **Mercados de predicción**

### Una mirada más cercana

Hedgehog es un paquete que vive en tu aplicación de front-end para crear y administrar la entropy de un usuario \\(del cual se deriva una clave privada\\). Hedgehog depende de un nombre de usuario y contraseña para crear artefactos de autor, para que sea capaz de simular un sistema de autenticación familiar que permite a los usuarios registrarse o iniciar sesión desde múltiples navegadores o dispositivos y recuperar su entrada. Esos artefactos, a través de hedgehog, persisten en el backend de tu elección.

**NOTA**: Una clave privada solo es computada y disponible en el lado del cliente y nunca se transmite o almacena en ningún lugar del navegador del usuario.

```javascript
// Proporcionar getFn, setAuthFn, setUserFn como solicitudes a su servicio de base de datos/backend (más detalles en documentos).
const hedgehog = new Hedgehog(getFn, setAuthFn, setUserFn)
let wallet
if (hedgehog.isLoggedIn()) {
  wallet = hedgehog.getWallet()
} else {
  wallet = await hedgehog.login('username', 'password')
  // or
  wallet = await hedgehog.signUp('username', 'password')
}
```

Después de crear o recuperar la cartera de un usuario, usted puede **depositar directamente a su cartera** para pagar comisiones de transacción o **transmitir sus transacciones a través de un relayer EIP-712**.


### 👉 [Profundizar en la documentación](https://audiusproject.github.io/hedgehog-docs/#installation)👈
