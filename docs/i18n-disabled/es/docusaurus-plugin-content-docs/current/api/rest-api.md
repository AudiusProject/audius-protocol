---
sidebar_label: API REST
sidebar_position: 1
description: >-
  La API de Audius es totalmente gratuita. Le pedimos que se adhiera a las directrices de este doc y siempre acreditado a los artistas.
---

# API REST

## Seleccionando un host <a id="selecting-a-host"></a>

Audius es un servicio de transmisión de música descentralizado. Para utilizar la API, primero selecciona un endpoint API de la lista de endpoints devueltos por:

[https://api.audius.co](https://api.audius.co/)

Una vez que hayas seleccionado un host, todas las solicitudes de API pueden ser enviadas directamente a él. Recomendamos seleccionar un host cada vez que su aplicación se inicie, ya que la disponibilidad puede cambiar con el tiempo.

Para la siguiente mención, hemos seleccionado una para ti:

`https://discoveryprovider.audius1.prod-us-west-2.staked.cloud`

> Muestra de código

```javascript

const sample = (arr) => arr[Math.floor(Math.random() * arr.length)]
const host = await fetch('https://api.audius.co')
  .then(r => r.json())
  .then(j => j.data)
  .then(d => sample(d))

```

## Especificando nombre de aplicación <a id="specifying-app-name"></a>

Si estás integrando la API de Audius en una aplicación en producción, le pedimos que incluya un parámetro `&app_name=<YOUR-UNIQUE-APP-NAME>` con cada consulta. ¡Tu nombre de aplicación único depende enteramente de ti!

## Usuarios <a id="api-users"></a>

### Buscar usuarios <a id="search-users"></a>

`Obtener /usuarios/buscar`

_Seach por un usuario_

#### Parámetros de consulta <a id="search-users-parameters"></a>

| Nombre              | Tipo   | Requerido | Descripción      |
|:------------------- |:------ |:--------- |:---------------- |
| consulta            | cadena | verdad    | Buscar consulta  |
| sólo\_descargable | cadena | falso     | ninguna          |
| app\_name         | cadena | verdad    | Nombre de tu app |

#### Respuestas <a id="search-users-responses"></a>

| Estado | Significado                                                                     | Descripción          | Esquema                                                                                       |
|:------ |:------------------------------------------------------------------------------- |:-------------------- |:--------------------------------------------------------------------------------------------- |
| 200    | [Ok](https://tools.ietf.org/html/rfc7231#section-6.3.1)                         | ninguna              | [usuario\_búsqueda](https://audiusproject.github.io/api-docs/?javascript#schemauser_search) |
| 400    | [Solicitud incorrecta](https://tools.ietf.org/html/rfc7231#section-6.5.1)       | Solicitud incorrecta | Ninguna                                                                                       |
| 500    | [Error interno del servidor](https://tools.ietf.org/html/rfc7231#section-6.6.1) | Error del servidor   | Ninguna                                                                                       |

> Muestra de código

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('https://discoveryprovider.audius1.prod-us-west-2.staked.cloud/v1/users/search?query=Brownies&app_name=EXAMPLEAPP',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

> Ejemplo de respuesta

```json
{
  "data": [
    {
      "album_count": 0,
      "bio": "Makin' moves & keeping you on your toes. linktr.ee/browniesandlemonade",
      "cover_photo": {
        "640x": "https://creatornode.audius.co/ipfs/QmXVMM1RVqP6EFKuDq49HYq5aNSKXd24S7vcxR7qcPom6e/640x.jpg",
        "2000x": "https://creatornode.audius.co/ipfs/QmXVMM1RVqP6EFKuDq49HYq5aNSKXd24S7vcxR7qcPom6e/2000x.jpg"
      },
      "followee_count": 19,
      "follower_count": 11141,
      "handle": "TeamBandL",
      "id": "nlGNe",
      "is_verified": true,
      "location": "Los Angeles, CA",
      "name": "Brownies & Lemonade",
      "playlist_count": 2,
      "profile_picture": {
        "150x150": "https://creatornode.audius.co/ipfs/QmU9L4beAM96MpiNqqVTZdiDiCRTeBku1AJCh3NXrE5PxV/150x150.jpg",
        "480x480": "https://creatornode.audius.co/ipfs/QmU9L4beAM96MpiNqqVTZdiDiCRTeBku1AJCh3NXrE5PxV/480x480.jpg",
        "1000x1000": "https://creatornode.audius.co/ipfs/QmU9L4beAM96MpiNqqVTZdiDiCRTeBku1AJCh3NXrE5PxV/1000x1000.jpg"
      },
      "repost_count": 5,
      "track_count": 4
    }
  ]
}
```

### Obtener usuario <a id="get-user"></a>

`GET /users/{user_id}`

_Obtener un único usuario_

#### Parámetros de consulta <a id="get-user-parameters"></a>

| Nombre        | Tipo   | Requerido | Descripción      |
|:------------- |:------ |:--------- |:---------------- |
| usuario\_id | cadena | verdad    | Un ID de usuario |
| app\_name   | cadena | verdad    | Nombre de tu app |

#### Respuestas <a id="get-user-responses"></a>

| Estado | Significado                                                                     | Descripción          | Esquema                                                                                          |
|:------ |:------------------------------------------------------------------------------- |:-------------------- |:------------------------------------------------------------------------------------------------ |
| 200    | [Ok](https://tools.ietf.org/html/rfc7231#section-6.3.1)                         | ninguna              | [usuario\_respuesta](https://audiusproject.github.io/api-docs/?javascript#schemauser_response) |
| 400    | [Solicitud incorrecta](https://tools.ietf.org/html/rfc7231#section-6.5.1)       | Solicitud incorrecta | Ninguna                                                                                          |
| 500    | [Error interno del servidor](https://tools.ietf.org/html/rfc7231#section-6.6.1) | Error del servidor   | Ninguna                                                                                          |

> Muestra de código

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('https://discoveryprovider.audius1.prod-us-west-2.staked.cloud/v1/users/nlGNe?app_name=EXAMPLEAPP',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

> Ejemplo de respuesta

```json
{
  "data": {
    "album_count": 0,
    "bio": "Makin' moves & keeping you on your toes. inktr.ee/browniesandlemonade",
    "cover_photo": {
      "640x": "https://creatornode.audius.co/ipfs/QmXVMM1RVqP6EFKuDq49HYq5aNSKXd24S7vcxR7qcPom6e/640x.jpg",
      "2000x": "https://creatornode.audius.co/ipfs/QmXVMM1RVqP6EFKuDq49HYq5aNSKXd24S7vcxR7qcPom6e/2000x.jpg"
    },
    "followee_count": 19,
    "follower_count": 11141,
    "handle": "TeamBandL",
    "id": "nlGNe",
    "is_verified": true,
    "location": "Los Angeles, CA",
    "name": "Brownies & Lemonade",
    "playlist_count": 2,
    "profile_picture": {
      "150x150": "https://creatornode.audius.co/ipfs/QmU9L4beAM96MpiNqqVTZdiDiCRTeBku1AJCh3NXrE5PxV/150x150.jpg",
      "480x480": "https://creatornode.audius.co/ipfs/QmU9L4beAM96MpiNqqVTZdiDiCRTeBku1AJCh3NXrE5PxV/480x480.jpg",
      "1000x1000": "https://creatornode.audius.co/ipfs/QmU9L4beAM96MpiNqqVTZdiDiCRTeBku1AJCh3NXrE5PxV/1000x1000.jpg"
    },
    "repost_count": 5,
    "track_count": 4
  }
}
```

### Obtener pistas favoritas del usuario <a id="get-user-39-s-favorite-tracks"></a>

`GET /users/{user_id}/favoritos`

_Obtener las pistas favoritas para un usuario_

#### Parámetros de consulta <a id="get-user&apos;s-favorite-tracks-parameters"></a>

| Nombre        | Tipo   | Requerido | Descripción      |
|:------------- |:------ |:--------- |:---------------- |
| usuario\_id | cadena | verdad    | Un ID de usuario |
| app\_name   | cadena | verdad    | Nombre de tu app |

#### Respuestas <a id="get-user&apos;s-favorite-tracks-responses"></a>

| Estado | Significado                                                                     | Descripción          | Esquema                                                                                                 |
|:------ |:------------------------------------------------------------------------------- |:-------------------- |:------------------------------------------------------------------------------------------------------- |
| 200    | [Ok](https://tools.ietf.org/html/rfc7231#section-6.3.1)                         | ninguna              | [favoritos\_respuesta](https://audiusproject.github.io/api-docs/?javascript#schemafavorites_response) |
| 400    | [Solicitud incorrecta](https://tools.ietf.org/html/rfc7231#section-6.5.1)       | Solicitud incorrecta | Ninguna                                                                                                 |
| 500    | [Error interno del servidor](https://tools.ietf.org/html/rfc7231#section-6.6.1) | Error del servidor   | Ninguna                                                                                                 |

> Muestra de código

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('https://discoveryprovider.audius1.prod-us-west-2.staked.cloud/v1/users/nlGNe/favorites?app_name=EXAMPLEAPP',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

> Ejemplo de respuesta

```json
{
  "data": [
    {
      "favorite_item_id": "n3yVD",
      "favorite_type": "SaveType.track",
      "user_id": "nlGNe"
    },
    {
      "favorite_item_id": "nlv5l",
      "favorite_type": "SaveType.track",
      "user_id": "nlGNe"
    },
    {
      "favorite_item_id": "ezYKz",
      "favorite_type": "SaveType.track",
      "user_id": "nlGNe"
    }
  ]
}
```

### Obtener reposts de usuario <a id="get-user-39-s-reposts"></a>

`Obtener /usuarios/{user_id}/reposts`

#### Parámetros de consulta <a id="get-user&apos;s-reposts-parameters"></a>

| Nombre        | Tipo   | Requerido | Descripción      |
|:------------- |:------ |:--------- |:---------------- |
| usuario\_id | cadena | verdad    | Un ID de usuario |
| límite        | cadena | falso     | Límite           |
| offset        | cadena | falso     | Offset           |
| app\_name   | cadena | verdad    | Nombre de tu app |

#### Respuestas <a id="get-user&apos;s-reposts-responses"></a>

| Estado | Significado                                                                     | Descripción          | Esquema                                                                       |
|:------ |:------------------------------------------------------------------------------- |:-------------------- |:----------------------------------------------------------------------------- |
| 200    | [Ok](https://tools.ietf.org/html/rfc7231#section-6.3.1)                         | Exitoso              | [reposts](https://audiusproject.github.io/api-docs/?javascript#schemareposts) |
| 400    | [Solicitud incorrecta](https://tools.ietf.org/html/rfc7231#section-6.5.1)       | Solicitud incorrecta | Ninguna                                                                       |
| 500    | [Error interno del servidor](https://tools.ietf.org/html/rfc7231#section-6.6.1) | Error del servidor   | Ninguna                                                                       |


> Muestra de código

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('https://discoveryprovider.audius1.prod-us-west-2.staked.cloud/v1/users/string/reposts?app_name=EXAMPLEAPP',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

> Ejemplo de respuesta
> 
> 200 Respuesta

```json
{
  "data": [
    {
      "timestamp": "string",
      "item_type": {},
      "item": {}
    }
  ]
}
```

### Obtén las etiquetas de pista más utilizadas del usuario <a id="get-user-39-s-most-used-track-tags"></a>

`GET /users/{user_id}/tags`

_Obtener etiquetas más usadas en las pistas del usuario_

#### Parámetros de consulta <a id="get-user&apos;s-most-used-track-tags-parameters"></a>

| Nombre        | Tipo   | Requerido | Descripción                    |
|:------------- |:------ |:--------- |:------------------------------ |
| usuario\_id | cadena | verdad    | Un ID de usuario               |
| límite        | entero | falso     | Limitar el número de etiquetas |
| app\_name   | cadena | verdad    | Nombre de tu app               |
| usuario\_id | cadena | verdad    | ninguna                        |

#### Respuestas <a id="get-user&apos;s-most-used-track-tags-responses"></a>

| Estado | Significado                                                                     | Descripción          | Esquema                                                                                            |
|:------ |:------------------------------------------------------------------------------- |:-------------------- |:-------------------------------------------------------------------------------------------------- |
| 200    | [Ok](https://tools.ietf.org/html/rfc7231#section-6.3.1)                         | Exitoso              | [etiquetas\_respuesta](https://audiusproject.github.io/api-docs/?javascript#schematags_response) |
| 400    | [Solicitud incorrecta](https://tools.ietf.org/html/rfc7231#section-6.5.1)       | Solicitud incorrecta | Ninguna                                                                                            |
| 500    | [Error interno del servidor](https://tools.ietf.org/html/rfc7231#section-6.6.1) | Error del servidor   | Ninguna                                                                                            |

> Muestra de código

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('https://discoveryprovider.audius1.prod-ichard west-2.staked. loud/v1/users/string/tags?user_id=string&app_name=EXAMPLEAPP',
{
  method: 'GET',

  headers: headers
})
. hen(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

> Ejemplo de respuesta
> 
> 200 Respuesta

```json
{
  "data": [
    "string"
  ]
}
```

### Obtener pistas de usuario <a id="get-user-39-s-tracks"></a>

`GET /users/{user_id}/tracks`

_Obtener una lista de pistas para un usuario_

#### Parámetros de consulta <a id="get-user&apos;s-tracks-parameters"></a>

| Nombre        | Tipo   | Requerido | Descripción      |
|:------------- |:------ |:--------- |:---------------- |
| usuario\_id | cadena | verdad    | Un ID de usuario |
| límite        | cadena | falso     | Límite           |
| offset        | cadena | falso     | Offset           |
| ordenar       | cadena | falso     | Ordenar modo     |
| app\_name   | cadena | verdad    | Nombre de tu app |

#### Respuestas <a id="get-user&apos;s-tracks-responses"></a>

| Estado | Significado                                                                     | Descripción          | Esquema                                                                                           |
|:------ |:------------------------------------------------------------------------------- |:-------------------- |:------------------------------------------------------------------------------------------------- |
| 200    | [Ok](https://tools.ietf.org/html/rfc7231#section-6.3.1)                         | ninguna              | [pistas\_respuesta](https://audiusproject.github.io/api-docs/?javascript#schematracks_response) |
| 400    | [Solicitud incorrecta](https://tools.ietf.org/html/rfc7231#section-6.5.1)       | Solicitud incorrecta | Ninguna                                                                                           |
| 500    | [Error interno del servidor](https://tools.ietf.org/html/rfc7231#section-6.6.1) | Error del servidor   | Ninguna                                                                                           |

> Muestra de código

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('https://discoveryprovider.audius1.prod-us-west-2.staked.cloud/v1/users/nlGNe/tracks?app_name=EXAMPLEAPP',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

> Ejemplo de respuesta

```json
{
  "data": [
    {
      "artwork": {
        "150x150": "https://creatornode.audius.co/ipfs/QmVJjA6zXhDZn3BjcjYa33P9NDiPZj7Vyq9TCx1bHjvHmG/150x150.jpg",
        "480x480": "https://creatornode.audius.co/ipfs/QmVJjA6zXhDZn3BjcjYa33P9NDiPZj7Vyq9TCx1bHjvHmG/480x480.jpg",
        "1000x1000": "https://creatornode.audius.co/ipfs/QmVJjA6zXhDZn3BjcjYa33P9NDiPZj7Vyq9TCx1bHjvHmG/1000x1000.jpg"
      },
      "description": "@baauer b2b @partyfavormusic live set at Brownies & Lemonade Block Party LA at The Shrine on 7.3.19.",
      "genre": "Electronic",
      "id": "D7KyD",
      "mood": "Fiery",
      "release_date": "Mon Sep 23 2019 12:35:10 GMT-0700",
      "repost_count": 47,
      "favorite_count": 143,
      "tags": "baauer,partyfavor,browniesandlemonade,live",
      "title": "Paauer | Baauer B2B Party Favor | B&L Block Party LA (Live Set)",
      "duration": 5265,
      "user": {
        "album_count": 0,
        "bio": "Makin' moves & keeping you on your toes. linktr.ee/browniesandlemonade",
        "cover_photo": {
          "640x": "https://creatornode.audius.co/ipfs/QmXVMM1RVqP6EFKuDq49HYq5aNSKXd24S7vcxR7qcPom6e/640x.jpg",
          "2000x": "https://creatornode.audius.co/ipfs/QmXVMM1RVqP6EFKuDq49HYq5aNSKXd24S7vcxR7qcPom6e/2000x.jpg"
        },
        "followee_count": 19,
        "follower_count": 11141,
        "handle": "TeamBandL",
        "id": "nlGNe",
        "is_verified": true,
        "location": "Los Angeles, CA",
        "name": "Brownies & Lemonade",
        "playlist_count": 2,
        "profile_picture": {
          "150x150": "https://creatornode.audius.co/ipfs/QmU9L4beAM96MpiNqqVTZdiDiCRTeBku1AJCh3NXrE5PxV/150x150.jpg",
          "480x480": "https://creatornode.audius.co/ipfs/QmU9L4beAM96MpiNqqVTZdiDiCRTeBku1AJCh3NXrE5PxV/480x480.jpg",
          "1000x1000": "https://creatornode.audius.co/ipfs/QmU9L4beAM96MpiNqqVTZdiDiCRTeBku1AJCh3NXrE5PxV/1000x1000.jpg"
        },
        "repost_count": 5,
        "track_count": 4
      }
    }
  ]
}
```

## Lista de reproducción <a id="api-playlists"></a>

### Buscar listas de reproducción <a id="search-playlists"></a>

`Obtener /Listas de reproducción/buscar`

_Buscar una lista de reproducción_

#### Parámetros de consulta <a id="search-playlists-parameters"></a>

| Nombre              | Tipo   | Requerido | Descripción      |
|:------------------- |:------ |:--------- |:---------------- |
| consulta            | cadena | verdad    | Búsqueda         |
| sólo\_descargable | cadena | falso     | ninguna          |
| app\_name         | cadena | verdad    | Nombre de tu app |

#### Respuestas <a id="search-playlists-responses"></a>

| Estado | Significado                                                                     | Descripción          | Esquema                                                                                                           |
|:------ |:------------------------------------------------------------------------------- |:-------------------- |:----------------------------------------------------------------------------------------------------------------- |
| 200    | [Ok](https://tools.ietf.org/html/rfc7231#section-6.3.1)                         | ninguna              | [playlist\_search\_result](https://audiusproject.github.io/api-docs/?javascript#schemaplaylist_search_result) |
| 400    | [Solicitud incorrecta](https://tools.ietf.org/html/rfc7231#section-6.5.1)       | Solicitud incorrecta | Ninguna                                                                                                           |
| 500    | [Error interno del servidor](https://tools.ietf.org/html/rfc7231#section-6.6.1) | Error del servidor   | Ninguna                                                                                                           |

> Muestra de código

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('https://discoveryprovider.audius1.prod-us-west-2.staked.cloud/v1/playlists/search?query=Hot & New&app_name=EXAMPLEAPP',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

> Ejemplo de respuesta

```json
{
  "data": [
    {
      "artwork": {
        "150x150": "https://usermetadata.audius.co/ipfs/Qmc7RFzLGgW3DUTgKK49LzxEwe3Lmb47q85ZwJJRVYTXPr/150x150.jpg",
        "480x480": "https://usermetadata.audius.co/ipfs/Qmc7RFzLGgW3DUTgKK49LzxEwe3Lmb47q85ZwJJRVYTXPr/480x480.jpg",
        "1000x1000": "https://usermetadata.audius.co/ipfs/Qmc7RFzLGgW3DUTgKK49LzxEwe3Lmb47q85ZwJJRVYTXPr/1000x1000.jpg"
      },
      "description": "All the latest hot new tracks on Audius! Enjoy the eclectic sounds that are created during the peak of this 2020 Summer.",
      "id": "DOPRl",
      "is_album": true,
      "playlist_name": "Hot & New on Audius 🔥",
      "repost_count": 46,
      "favorite_count": 88,
      "user": {
        "album_count": 0,
        "bio": "The official Audius account! Creación de una plataforma de música en streaming descentralizada y de código abierto controlada por artistas, fans, & desarrolladores",",
        "cover_photo": {
          "640x": "string",
          "2000x": "string"
        },
        "followee_count": 69,
        "follower_count": 6763,
        "handle": "Audius",
        "id": "eJ57D",
        "is_verified": true,
        "location": "SF & LA",
        "name": "Audius",
        "playlist_count": 9,
        "profile_picture": {
          "150x150": "https://usermetadata.audius.co/ipfs/QmNjJv1wQf2DJq3GNXjXzSL8UXFUGXfchg4NhL7UpbnF1f",
          "480x480": "https://usermetadata.audius.co/ipfs/QmNjJv1wQf2DJq3GNXjXzSL8UXFUGXfchg4NhL7UpbnF1f",
          "1000x1000": "https://usermetadata.audius.co/ipfs/QmNjJv1wQf2DJq3GNXjXzSL8UXFUGXfchg4NhL7UpbnF1f"
        },
        "repost_count": 200,
        "track_count": 0
      }
    }
  ]
}
```

### Obtener playlist <a id="get-playlist"></a>

`OBTENER /playlists/{playlist_id}`

_Buscar una lista_

#### Parámetros de consulta <a id="get-playlist-parameters"></a>

| Nombre         | Tipo   | Requerido | Descripción                    |
|:-------------- |:------ |:--------- |:------------------------------ |
| playlist\_id | cadena | verdad    | Un ID de lista de reproducción |
| app\_name    | cadena | verdad    | Nombre de tu app               |

#### Respuestas <a id="get-playlist-responses"></a>

| Estado | Significado                                                                     | Descripción          | Esquema                                                                                               |
|:------ |:------------------------------------------------------------------------------- |:-------------------- |:----------------------------------------------------------------------------------------------------- |
| 200    | [Ok](https://tools.ietf.org/html/rfc7231#section-6.3.1)                         | ninguna              | [playlist\_respuesta](https://audiusproject.github.io/api-docs/?javascript#schemaplaylist_response) |
| 400    | [Solicitud incorrecta](https://tools.ietf.org/html/rfc7231#section-6.5.1)       | Solicitud incorrecta | Ninguna                                                                                               |
| 500    | [Error interno del servidor](https://tools.ietf.org/html/rfc7231#section-6.6.1) | Error del servidor   | Ninguna                                                                                               |


> Muestra de código

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('https://discoveryprovider.audius1.prod-us-west-2.staked.cloud/v1/playlists/DOPRl?app_name=EXAMPLEAPP',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

> Ejemplo de respuesta

```json
{
  "data": {
    "artwork": {
      "150x150": "https://usermetadata.audius.co/ipfs/Qmc7RFzLGgW3DUTgKK49LzxEwe3Lmb47q85ZwJJRVYTXPr/150x150.jpg",
      "480x480": "https://usermetadata.audius.co/ipfs/Qmc7RFzLGgW3DUTgKK49LzxEwe3Lmb47q85ZwJJRVYTXPr/480x480.jpg",
      "1000x1000": "https://usermetadata.audius.co/ipfs/Qmc7RFzLGgW3DUTgKK49LzxEwe3Lmb47q85ZwJJRVYTXPr/1000x1000.jpg"
    },
    "description": "All the latest hot new tracks on Audius! Enjoy the eclectic sounds that are created during the peak of this 2020 Summer.",
    "id": "DOPRl",
    "is_album": true,
    "playlist_name": "Hot & New on Audius 🔥",
    "repost_count": 46,
    "favorite_count": 88,
    "user": {
      "album_count": 0,
      "bio": "The official Audius account! Crear una plataforma de música de streaming descentralizada y de código abierto controlada por artistas, fans & desarrolladores. ,
      "cover_photo": {
        "640x": "string",
        "2000x": "cadena"
      },
      "followeek_count": 69,
      "follower_count": 6763,
      "handle": "Audius",
      "id": "eJ57D",
      "is_verified": true,
      "location": "SF & LA",
      "nombre": "Audius",
      "playlist_count": 9,
      "profile_picture": {
        "150x150": "https://usermetadata. udius.co/ipfs/QmNjJv1wQf2DJq3GNXjXzSL8UXFUGXfchg4NhL7UpbnF1f",
        "480x480": "https://usermetadata.audius.co/ipfs/QmNjJv1wQf2DJq3GNXjXzSL8UXFUGXfchg4NhL7UpbnF1f",
        "1000x1000": "https://usermetadata. udio. o/ipfs/QmNjJv1wQf2DJq3GNXjXzSL8UXFUGXfchg4NhL7UpbnF1f"
      },
      "repost_count": 200,
      "track_count": 0
    }
  }
}
```

### Obtener pistas de lista de reproducción <a id="get-playlist-tracks"></a>

`OBTENER /listas de reproducción/{playlist_id}/pistas`

_Obtener pistas dentro de una lista de reproducción_

#### Parámetros de consulta <a id="get-playlist-tracks-parameters"></a>

| Nombre         | Tipo   | Requerido | Descripción                    |
|:-------------- |:------ |:--------- |:------------------------------ |
| playlist\_id | cadena | verdad    | Un ID de lista de reproducción |
| app\_name    | cadena | verdad    | Nombre de tu app               |

#### Respuestas <a id="get-playlist-tracks-responses"></a>

| Estado | Significado                                                                     | Descripción          | Esquema                                                                                                                |
|:------ |:------------------------------------------------------------------------------- |:-------------------- |:---------------------------------------------------------------------------------------------------------------------- |
| 200    | [Ok](https://tools.ietf.org/html/rfc7231#section-6.3.1)                         | ninguna              | [playlist\_pistas\_respuesta](https://audiusproject.github.io/api-docs/?javascript#schemaplaylist_tracks_response) |
| 400    | [Solicitud incorrecta](https://tools.ietf.org/html/rfc7231#section-6.5.1)       | Solicitud incorrecta | Ninguna                                                                                                                |
| 500    | [Error interno del servidor](https://tools.ietf.org/html/rfc7231#section-6.6.1) | Error del servidor   | Ninguna                                                                                                                |


> Muestra de código

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('https://discoveryprovider.audius1.prod-us-west-2.staked.cloud/v1/playlists/DOPRl?app_name=EXAMPLEAPP',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

> Ejemplo de respuesta

```json
{
  "data": [
    {
      "artwork": {
        "150x150": "https://creatornode. udius.co/ipfs/QmVJjjA6zXhDZn3BjcjYa33P9NDiPZj7Vyq9TCx1bHjvHmG/150x150. Pg",
        "480x480": "https://creatornode.audius.co/ipfs/QmVJjA6zXhDZn3BjcjYa33P9NDiPZj7Vyq9TCx1bHjvHmG/480x480. pg",
        "1000x1000": "https://creatornode.audius.co/ipfs/QmVJjjA6zXhDZn3BjcjYa33P9NDiPZj7Vyq9TCx1bHjvHmG/1000x1000. Pg"
      },
      "description": "@baauer b2b @partyfavormusic en vivo establecido en Brownies & Lemonade Block Party LA en The Shrine el 7.3. 9.",
      "género": "Electronic",
      "id": "D7KyD",
      "mood": "Fiery",
      "release_date": "Lon Sep 23 2019 12:35:10 GMT-0700",
      "repost_count": 47,
      "favorito_count": 143,
      "etiquetas": "baauer, partyfavor, rowniesandlemonade,live",
      "título": "Paauer | Baauer B2B Party Favor | B&L Block Party LA (Live Set)",
      "duración: 5265,
      "usuario": {
        "álbum_count": 0,
        "bio": "Makin' se mueve & manteniéndote en tus dedos. linktr.ee/browniesandlemonade",
        "cover_photo": {
          "640x": "https://creatornode.audius.co/ipfs/QmXVMM1RVqP6EFKuDq49HYq5aNSKXd24S7vcxR7qcPom6e/640x.jpg",
          "2000x": "https://creatornode.audius.co/ipfs/QmXVMM1RVqP6EFKuDq49HYq5aNSKXd24S7vcxR7qcPom6e/2000x.jpg"
        },
        "followee_count": 19,
        "follower_count": 11141,
        "handle": "TeamBandL",
        "id": "nlGNe",
        "is_verified": true,
        "location": "Los Angeles, CA",
        "name": "Brownies & Lemonade",
        "playlist_count": 2,
        "profile_picture": {
          "150x150": "https://creatornode.audius.co/ipfs/QmU9L4beAM96MpiNqqVTZdiDiCRTeBku1AJCh3NXrE5PxV/150x150.jpg",
          "480x480": "https://creatornode.audius.co/ipfs/QmU9L4beAM96MpiNqqVTZdiDiCRTeBku1AJCh3NXrE5PxV/480x480.jpg",
          "1000x1000": "https://creatornode.audius.co/ipfs/QmU9L4beAM96MpiNqqVTZdiDiCRTeBku1AJCh3NXrE5PxV/1000x1000.jpg"
        },
        "repost_count": 5,
        "track_count": 4
      }
    }
  ]
}
```

## Pistas <a id="api-tracks"></a>

### Buscar pistas <a id="search-tracks"></a>

`Obtener /pistas/búsqueda`

_Buscar un track_

#### Parámetros de consulta <a id="search-tracks-parameters"></a>

| Nombre              | Tipo   | Requerido | Descripción                       |
|:------------------- |:------ |:--------- |:--------------------------------- |
| consulta            | cadena | verdad    | Búsqueda                          |
| sólo\_descargable | cadena | falso     | Devolver sólo pistas descargables |
| app\_name         | cadena | verdad    | Nombre de tu app                  |

#### Respuestas <a id="search-tracks-responses"></a>

| Estado | Significado                                                                     | Descripción          | Esquema                                                                                       |
|:------ |:------------------------------------------------------------------------------- |:-------------------- |:--------------------------------------------------------------------------------------------- |
| 200    | [Ok](https://tools.ietf.org/html/rfc7231#section-6.3.1)                         | ninguna              | [seguir\_búsqueda](https://audiusproject.github.io/api-docs/?javascript#schematrack_search) |
| 400    | [Solicitud incorrecta](https://tools.ietf.org/html/rfc7231#section-6.5.1)       | Solicitud incorrecta | Ninguna                                                                                       |
| 500    | [Error interno del servidor](https://tools.ietf.org/html/rfc7231#section-6.6.1) | Error del servidor   | Ninguna                                                                                       |



> Muestra de código

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('https://discoveryprovider.audius1.prod-us-west-2.staked.cloud/v1/tracks/search?query=baauer b2b&app_name=EXAMPLEAPP',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

> Ejemplo de respuesta

```json
{
  "data": [
    {
      "artwork": {
        "150x150": "https://creatornode.audius.co/ipfs/QmVJjA6zXhDZn3BjcjYa33P9NDiPZj7Vyq9TCx1bHjvHmG/150x150.jpg",
        "480x480": "https://creatornode.audius.co/ipfs/QmVJjA6zXhDZn3BjcjYa33P9NDiPZj7Vyq9TCx1bHjvHmG/480x480.jpg",
        "1000x1000": "https://creatornode.audius.co/ipfs/QmVJjA6zXhDZn3BjcjYa33P9NDiPZj7Vyq9TCx1bHjvHmG/1000x1000.jpg"
      },
      "description": "@baauer b2b @partyfavormusic live set at Brownies & Lemonade Block Party LA at The Shrine on 7.3.19.",
      "genre": "Electronic",
      "id": "D7KyD",
      "mood": "Fiery",
      "release_date": "Mon Sep 23 2019 12:35:10 GMT-0700",
      "repost_count": 47,
      "favorite_count": 143,
      "tags": "baauer,partyfavor,browniesandlemonade,live",
      "title": "Paauer | Baauer B2B Party Favor | B&L Block Party LA (Live Set)",
      "duration": 5265,
      "user": {
        "album_count": 0,
        "bio": "Makin' moves & keeping you on your toes. linktr.ee/browniesandlemonade",
        "cover_photo": {
          "640x": "https://creatornode.audius.co/ipfs/QmXVMM1RVqP6EFKuDq49HYq5aNSKXd24S7vcxR7qcPom6e/640x.jpg",
          "2000x": "https://creatornode.audius.co/ipfs/QmXVMM1RVqP6EFKuDq49HYq5aNSKXd24S7vcxR7qcPom6e/2000x.jpg"
        },
        "followee_count": 19,
        "follower_count": 11141,
        "handle": "TeamBandL",
        "id": "nlGNe",
        "is_verified": true,
        "location": "Los Angeles, CA",
        "name": "Brownies & Lemonade",
        "playlist_count": 2,
        "profile_picture": {
          "150x150": "https://creatornode.audius.co/ipfs/QmU9L4beAM96MpiNqqVTZdiDiCRTeBku1AJCh3NXrE5PxV/150x150.jpg",
          "480x480": "https://creatornode.audius.co/ipfs/QmU9L4beAM96MpiNqqVTZdiDiCRTeBku1AJCh3NXrE5PxV/480x480.jpg",
          "1000x1000": "https://creatornode.audius.co/ipfs/QmU9L4beAM96MpiNqqVTZdiDiCRTeBku1AJCh3NXrE5PxV/1000x1000.jpg"
        },
        "repost_count": 5,
        "track_count": 4
      }
    }
  ]
}
```

### Pistas populares <a id="trending-tracks"></a>

`GET /tracks/tendencia`

_Obtiene las 100 pistas más populares \(más popular\) en Audius_

#### Parámetros de consulta <a id="trending-tracks-parameters"></a>

| Nombre      | Tipo   | Requerido | Descripción                                                                    |
|:----------- |:------ |:--------- |:------------------------------------------------------------------------------ |
| género      | cadena | falso     | Pistas populares para un género especificado                                   |
| tiempo      | cadena | falso     | Pistas populares en un rango de tiempo especificado \(semana, mes, allTime\) |
| app\_name | cadena | verdad    | Nombre de tu app                                                               |

#### Respuestas <a id="trending-tracks-responses"></a>

| Estado | Significado                                                                     | Descripción          | Esquema                                                                                           |
|:------ |:------------------------------------------------------------------------------- |:-------------------- |:------------------------------------------------------------------------------------------------- |
| 200    | [Ok](https://tools.ietf.org/html/rfc7231#section-6.3.1)                         | ninguna              | [pistas\_respuesta](https://audiusproject.github.io/api-docs/?javascript#schematracks_response) |
| 400    | [Solicitud incorrecta](https://tools.ietf.org/html/rfc7231#section-6.5.1)       | Solicitud incorrecta | Ninguna                                                                                           |
| 500    | [Error interno del servidor](https://tools.ietf.org/html/rfc7231#section-6.6.1) | Error del servidor   | Ninguna                                                                                           |

> Muestra de código

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('https://discoveryprovider.audius1.prod-us-west-2.staked.cloud/v1/tracks/trending?app_name=EXAMPLEAPP',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

> Ejemplo de respuesta

```json
{
  "data": [
    {
      "artwork": {
        "150x150": "https://creatornode.audius.co/ipfs/QmVJjA6zXhDZn3BjcjYa33P9NDiPZj7Vyq9TCx1bHjvHmG/150x150.jpg",
        "480x480": "https://creatornode.audius.co/ipfs/QmVJjA6zXhDZn3BjcjYa33P9NDiPZj7Vyq9TCx1bHjvHmG/480x480.jpg",
        "1000x1000": "https://creatornode.audius.co/ipfs/QmVJjA6zXhDZn3BjcjYa33P9NDiPZj7Vyq9TCx1bHjvHmG/1000x1000.jpg"
      },
      "description": "@baauer b2b @partyfavormusic live set at Brownies & Lemonade Block Party LA at The Shrine on 7.3.19.",
      "genre": "Electronic",
      "id": "D7KyD",
      "mood": "Fiery",
      "release_date": "Mon Sep 23 2019 12:35:10 GMT-0700",
      "repost_count": 47,
      "favorite_count": 143,
      "tags": "baauer,partyfavor,browniesandlemonade,live",
      "title": "Paauer | Baauer B2B Party Favor | B&L Block Party LA (Live Set)",
      "duration": 5265,
      "user": {
        "album_count": 0,
        "bio": "Makin' moves & keeping you on your toes. linktr.ee/browniesandlemonade",
        "cover_photo": {
          "640x": "https://creatornode.audius.co/ipfs/QmXVMM1RVqP6EFKuDq49HYq5aNSKXd24S7vcxR7qcPom6e/640x.jpg",
          "2000x": "https://creatornode.audius.co/ipfs/QmXVMM1RVqP6EFKuDq49HYq5aNSKXd24S7vcxR7qcPom6e/2000x.jpg"
        },
        "followee_count": 19,
        "follower_count": 11141,
        "handle": "TeamBandL",
        "id": "nlGNe",
        "is_verified": true,
        "location": "Los Angeles, CA",
        "name": "Brownies & Lemonade",
        "playlist_count": 2,
        "profile_picture": {
          "150x150": "https://creatornode.audius.co/ipfs/QmU9L4beAM96MpiNqqVTZdiDiCRTeBku1AJCh3NXrE5PxV/150x150.jpg",
          "480x480": "https://creatornode.audius.co/ipfs/QmU9L4beAM96MpiNqqVTZdiDiCRTeBku1AJCh3NXrE5PxV/480x480.jpg",
          "1000x1000": "https://creatornode.audius.co/ipfs/QmU9L4beAM96MpiNqqVTZdiDiCRTeBku1AJCh3NXrE5PxV/1000x1000.jpg"
        },
        "repost_count": 5,
        "track_count": 4
      }
    }
  ]
}
```

### Obtener pista <a id="get-track"></a>

`OBTENER/ Canción/ {track_id}`

_Obtener una pista_

#### Parámetros de consulta <a id="get-track-parameters"></a>

| Nombre      | Tipo   | Requerido | Descripción      |
|:----------- |:------ |:--------- |:---------------- |
| track\_id | cadena | verdad    | Un ID de pista   |
| app\_name | cadena | verdad    | Nombre de tu app |

#### Respuestas <a id="get-track-responses"></a>

| Estado | Significado                                                                     | Descripción          | Esquema                                                                                          |
|:------ |:------------------------------------------------------------------------------- |:-------------------- |:------------------------------------------------------------------------------------------------ |
| 200    | [Ok](https://tools.ietf.org/html/rfc7231#section-6.3.1)                         | ninguna              | [pistas\_respuesta](https://audiusproject.github.io/api-docs/?javascript#schematrack_response) |
| 400    | [Solicitud incorrecta](https://tools.ietf.org/html/rfc7231#section-6.5.1)       | Solicitud incorrecta | Ninguna                                                                                          |
| 500    | [Error interno del servidor](https://tools.ietf.org/html/rfc7231#section-6.6.1) | Error del servidor   | Ninguna                                                                                          |

> Muestra de código

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('https://discoveryprovider.audius1.prod-us-west-2.staked.cloud/v1/tracks/D7KyD?app_name=EXAMPLEAPP',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

> Ejemplo de respuesta

```json
{
  "data": {
    "artwork": {
      "150x150": "https://creatornode.audius.co/ipfs/QmVJjA6zXhDZn3BjcjYa33P9NDiPZj7Vyq9TCx1bHjvHmG/150x150.jpg",
      "480x480": "https://creatornode.audius.co/ipfs/QmVJjA6zXhDZn3BjcjYa33P9NDiPZj7Vyq9TCx1bHjvHmG/480x480.jpg",
      "1000x1000": "https://creatornode.audius.co/ipfs/QmVJjA6zXhDZn3BjcjYa33P9NDiPZj7Vyq9TCx1bHjvHmG/1000x1000.jpg"
    },
    "description": "@baauer b2b @partyfavormusic live set at Brownies & Lemonade Block Party LA at The Shrine on 7.3.19.",
    "genre": "Electronic",
    "id": "D7KyD",
    "mood": "Fiery",
    "release_date": "Mon Sep 23 2019 12:35:10 GMT-0700",
    "repost_count": 47,
    "favorite_count": 143,
    "tags": "baauer,partyfavor,browniesandlemonade,live",
    "title": "Paauer | Baauer B2B Party Favor | B&L Block Party LA (Live Set)",
    "duration": 5265,
    "user": {
      "album_count": 0,
      "bio": "Makin' moves & keeping you on your toes. linktr.ee/browniesandlemonade",
      "cover_photo": {
        "640x": "https://creatornode.audius.co/ipfs/QmXVMM1RVqP6EFKuDq49HYq5aNSKXd24S7vcxR7qcPom6e/640x.jpg",
        "2000x": "https://creatornode.audius.co/ipfs/QmXVMM1RVqP6EFKuDq49HYq5aNSKXd24S7vcxR7qcPom6e/2000x.jpg"
      },
      "followee_count": 19,
      "follower_count": 11141,
      "handle": "TeamBandL",
      "id": "nlGNe",
      "is_verified": true,
      "location": "Los Angeles, CA",
      "name": "Brownies & Lemonade",
      "playlist_count": 2,
      "profile_picture": {
        "150x150": "https://creatornode.audius.co/ipfs/QmU9L4beAM96MpiNqqVTZdiDiCRTeBku1AJCh3NXrE5PxV/150x150.jpg",
        "480x480": "https://creatornode.audius.co/ipfs/QmU9L4beAM96MpiNqqVTZdiDiCRTeBku1AJCh3NXrE5PxV/480x480.jpg",
        "1000x1000": "https://creatornode.audius.co/ipfs/QmU9L4beAM96MpiNqqVTZdiDiCRTeBku1AJCh3NXrE5PxV/1000x1000.jpg"
      },
      "repost_count": 5,
      "track_count": 4
    }
  }
}
```

### Pista de streaming <a id="stream-track"></a>

`GET /tracks/{track_id}/stream`

_Obtener el archivo mp3 streamable de la pista_

Este extremo acepta la cabecera de Rango para streaming. https://developer.mozilla.org/es-US/docs/Web/HTTP/Range\_requests

#### Parámetros de consulta <a id="stream-track-parameters"></a>

| Nombre      | Tipo   | Requerido | Descripción      |
|:----------- |:------ |:--------- |:---------------- |
| track\_id | cadena | verdad    | Un ID de pista   |
| app\_name | cadena | verdad    | Nombre de tu app |

#### Respuestas <a id="stream-track-responses"></a>

| Estado | Significado                                                                     | Descripción                  | Esquema |
|:------ |:------------------------------------------------------------------------------- |:---------------------------- |:------- |
| 200    | [Ok](https://tools.ietf.org/html/rfc7231#section-6.3.1)                         | Exitoso                      | Ninguna |
| 216    | Desconocido                                                                     | Contenido parcial            | Ninguna |
| 400    | [Solicitud incorrecta](https://tools.ietf.org/html/rfc7231#section-6.5.1)       | Solicitud incorrecta         | Ninguna |
| 416    | [Rango no satisfactorio](https://tools.ietf.org/html/rfc7233#section-4.4)       | Rango de contenido no válido | Ninguna |
| 500    | [Error interno del servidor](https://tools.ietf.org/html/rfc7231#section-6.6.1) | Error del servidor           | Ninguna |

> Muestra de código

```javascript

fetch('https://discoveryprovider.audius1.prod-us-west-2.staked.cloud/v1/tracks/D7KyD/stream?app_name=EXAMPLEAPP',
{
  method: 'GET'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

## Métricas <a id="api-metrics"></a>

### get\_trailing\_app\_name\_metrics <a id="get_trailing_app_name_metrics"></a>

`GET /metrics/app_name/trailing/{time_range}`

_Obtiene métricas del nombre de la aplicación final desde matview_

#### Parámetros de consulta <a id="get_trailing_app_name_metrics-parameters"></a>

| Nombre          | Tipo   | Requerido | Descripción      |
|:--------------- |:------ |:--------- |:---------------- |
| app\_name     | cadena | verdad    | Nombre de tu app |
| tiempo\_rango | cadena | verdad    | ninguna          |

#### Respuestas <a id="get_trailing_app_name_metrics-responses"></a>

| Estado | Significado                                             | Descripción | Esquema                                                                                                                      |
|:------ |:------------------------------------------------------- |:----------- |:---------------------------------------------------------------------------------------------------------------------------- |
| 200    | [Ok](https://tools.ietf.org/html/rfc7231#section-6.3.1) | Exitoso     | [app\_name\_trailing\_response](https://audiusproject.github.io/api-docs/?javascript#schemaapp_name_trailing_response) |

> Muestra de código

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('https://discoveryprovider.audius1.prod-us-west-2.staked.cloud/v1/metrics/app_name/trailing/string?app_name=EXAMPLEAPP',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

> Ejemplo de respuesta
> 
> 200 Respuesta

```json
{
  "data": [
    {
      "count": 0,
      "name": "string"
    }
  ]
}
```

## Resolver <a id="api-resolve"></a>

### Resolver <a id="resolve"></a>

> Muestra de código

`GET /resolver`

_Resuelve y redirige una URL de la aplicación de Audius a la URL del recurso API que representa_

Este endpoint le permite buscar y acceder a los recursos API cuando sólo conoce la URL de audius.co. Se admiten pistas, listas de reproducción y usuarios.

#### Parámetros de consulta <a id="resolve-parameters"></a>

| Nombre      | Tipo   | Requerido | Descripción                                                                         |
|:----------- |:------ |:--------- |:----------------------------------------------------------------------------------- |
| url         | cadena | verdad    | URL a resolver. URL completa \(https://audius.co\) o simplemente la ruta absoluta |
| app\_name | cadena | verdad    | Nombre de tu app                                                                    |

> Ejemplo de respuesta
> 
> Redirección interna

```text
{"HTTP/1.1 302 Localización encontrada":"/v1/tracks/V4W8r"}
```

#### Respuestas <a id="resolve-responses"></a>

| Estado | Significado                                                     | Descripción         | Esquema |
|:------ |:--------------------------------------------------------------- |:------------------- |:------- |
| 302    | [Encontrado](https://tools.ietf.org/html/rfc7231#section-6.4.3) | Redirección interna | Ninguna |

#### Esquema de respuesta <a id="resolve-responseschema"></a>

```javascript

const headers = {
  'Accept':'text/plain'
};

fetch('https://discoveryprovider.audius1.prod-us-west-2.staked.cloud/v1/resolve?url=https://audius.co/camouflybeats/hypermantra-86216&app_name=EXAMPLEAPP',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```


## Esquemas <a id="schemas"></a>

Los siguientes son ejemplos de formatos de respuesta que se pueden esperar recibir de la API.

### usuario/_respuesta <a id="tocS_user_response"></a>

```json
{
  "data": {
    "album_count": 0,
    "bio": "string",
    "cover_photo": {
      "640x": "string",
      "2000x": "string"
    },
    "followee_count": 0,
    "follower_count": 0,
    "handle": "string",
    "id": "string",
    "is_verified": true,
    "location": "string",
    "name": "string",
    "playlist_count": 0,
    "profile_picture": {
      "150x150": "string",
      "480x480": "string",
      "1000x1000": "string"
    },
    "repost_count": 0,
    "track_count": 0
  }
}

```

#### Propiedades <a id="properties"></a>

| Nombre | Tipo                                                                        | Requerido | Restricciones | Descripción |
|:------ |:--------------------------------------------------------------------------- |:--------- |:------------- |:----------- |
| datos  | [usuarios](https://audiusproject.github.io/api-docs/?javascript#schemauser) | falso     | ninguna       | ninguna     |

### usuarios <a id="tocS_user"></a>

```json
{
  "album_count": 0,
  "bio": "string",
  "cover_photo": {
    "640x": "string",
    "2000x": "string"
  },
  "followee_count": 0,
  "follower_count": 0,
  "handle": "string",
  "id": "string",
  "is_verified": true,
  "location": "string",
  "name": "string",
  "playlist_count": 0,
  "profile_picture": {
    "150x150": "string",
    "480x480": "string",
    "1000x1000": "string"
  },
  "repost_count": 0,
  "track_count": 0
}

```

#### Propiedades <a id="properties-2"></a>

| Nombre             | Tipo                                                                                           | Requerido | Restricciones | Descripción |
|:------------------ |:---------------------------------------------------------------------------------------------- |:--------- |:------------- |:----------- |
| álbum\_conteo    | entero                                                                                         | verdad    | ninguna       | ninguna     |
| biografía          | cadena                                                                                         | falso     | ninguna       | ninguna     |
| foto\_cubierta   | [foto\_cubierta](https://audiusproject.github.io/api-docs/?javascript#schemacover_photo)     | falso     | ninguna       | ninguna     |
| followes\_count  | entero                                                                                         | verdad    | ninguna       | ninguna     |
| contador\_número | entero                                                                                         | verdad    | ninguna       | ninguna     |
| manejo             | cadena                                                                                         | verdad    | ninguna       | ninguna     |
| id                 | cadena                                                                                         | verdad    | ninguna       | ninguna     |
| está\_verificado | boolean                                                                                        | verdad    | ninguna       | ninguna     |
| ubicación          | cadena                                                                                         | falso     | ninguna       | ninguna     |
| nombre             | cadena                                                                                         | verdad    | ninguna       | ninguna     |
| playlist\_count  | entero                                                                                         | verdad    | ninguna       | ninguna     |
| perfil\_imagen   | [perfil\_imagen](https://audiusproject.github.io/api-docs/?javascript#schemaprofile_picture) | falso     | ninguna       | ninguna     |
| repost\_count    | entero                                                                                         | verdad    | ninguna       | ninguna     |
| pistas\_cuenta   | entero                                                                                         | verdad    | ninguna       | ninguna     |

### foto\_cubierta <a id="tocS_cover_photo"></a>

```json
{
  "640x": "string",
  "2000x": "string"
}

```

#### Propiedades <a id="properties-3"></a>

| Nombre | Tipo   | Requerido | Restricciones | Descripción |
|:------ |:------ |:--------- |:------------- |:----------- |
| 640x   | cadena | falso     | ninguna       | ninguna     |
| 2000x  | cadena | falso     | ninguna       | ninguna     |

### perfil\_imagen <a id="tocS_profile_picture"></a>

```json
{
  "150x150": "string",
  "480x480": "string",
  "1000x1000": "string"
}

```

#### Propiedades <a id="properties-4"></a>

| Nombre    | Tipo   | Requerido | Restricciones | Descripción |
|:--------- |:------ |:--------- |:------------- |:----------- |
| 150 x 150 | cadena | falso     | ninguna       | ninguna     |
| 480 x 480 | cadena | falso     | ninguna       | ninguna     |
| 1000x1000 | cadena | falso     | ninguna       | ninguna     |

### pistas\_respuesta <a id="tocS_tracks_response"></a>

```json
{
  "data": [
    {
      "artwork": {
        "150x150": "string",
        "480x480": "string",
        "1000x1000": "string"
      },
      "description": "string",
      "genre": "string",
      "id": "string",
      "mood": "string",
      "release_date": "string",
      "remix_of": {
        "tracks": [
          {
            "parent_track_id": "string"
          }
        ]
      },
      "repost_count": 0,
      "favorite_count": 0,
      "tags": "string",
      "title": "string",
      "user": {
        "album_count": 0,
        "bio": "string",
        "cover_photo": {
          "640x": "string",
          "2000x": "string"
        },
        "followee_count": 0,
        "follower_count": 0,
        "handle": "string",
        "id": "string",
        "is_verified": true,
        "location": "string",
        "name": "string",
        "playlist_count": 0,
        "profile_picture": {
          "150x150": "string",
          "480x480": "string",
          "1000x1000": "string"
        },
        "repost_count": 0,
        "track_count": 0
      },
      "duration": 0,
      "downloadable": true,
      "play_count": 0
    }
  ]
}

```

#### Propiedades <a id="properties-5"></a>

| Nombre | Tipo                                                                            | Requerido | Restricciones | Descripción |
|:------ |:------------------------------------------------------------------------------- |:--------- |:------------- |:----------- |
| datos  | \[[Pista](https://audiusproject.github.io/api-docs/?javascript#schematrack)\] | falso     | ninguna       | ninguna     |

### Pista <a id="tocS_Track"></a>

```json
{
  "artwork": {
    "150x150": "string",
    "480x480": "string",
    "1000x1000": "string"
  },
  "description": "string",
  "genre": "string",
  "id": "string",
  "mood": "string",
  "release_date": "string",
  "remix_of": {
    "tracks": [
      {
        "parent_track_id": "string"
      }
    ]
  },
  "repost_count": 0,
  "favorite_count": 0,
  "tags": "string",
  "title": "string",
  "user": {
    "album_count": 0,
    "bio": "string",
    "cover_photo": {
      "640x": "string",
      "2000x": "string"
    },
    "followee_count": 0,
    "follower_count": 0,
    "handle": "string",
    "id": "string",
    "is_verified": true,
    "location": "string",
    "name": "string",
    "playlist_count": 0,
    "profile_picture": {
      "150x150": "string",
      "480x480": "string",
      "1000x1000": "string"
    },
    "repost_count": 0,
    "track_count": 0
  },
  "duration": 0,
  "downloadable": true,
  "play_count": 0
}

```

#### Propiedades <a id="properties-6"></a>

| Nombre                | Tipo                                                                                          | Requerido | Restricciones | Descripción |
|:--------------------- |:--------------------------------------------------------------------------------------------- |:--------- |:------------- |:----------- |
| obra de arte          | [seguir\_artwork](https://audiusproject.github.io/api-docs/?javascript#schematrack_artwork) | falso     | ninguna       | ninguna     |
| descripción           | cadena                                                                                        | falso     | ninguna       | ninguna     |
| género                | cadena                                                                                        | falso     | ninguna       | ninguna     |
| id                    | cadena                                                                                        | verdad    | ninguna       | ninguna     |
| humor                 | cadena                                                                                        | falso     | ninguna       | ninguna     |
| lanzar\_fecha       | cadena                                                                                        | falso     | ninguna       | ninguna     |
| remix\_de           | [remix\_parent](https://audiusproject.github.io/api-docs/?javascript#schemaremix_parent)    | falso     | ninguna       | ninguna     |
| repost\_count       | entero                                                                                        | verdad    | ninguna       | ninguna     |
| contador de favoritos | entero                                                                                        | verdad    | ninguna       | ninguna     |
| etiquetas             | cadena                                                                                        | falso     | ninguna       | ninguna     |
| título                | cadena                                                                                        | verdad    | ninguna       | ninguna     |
| usuarios              | [usuarios](https://audiusproject.github.io/api-docs/?javascript#schemauser)                   | verdad    | ninguna       | ninguna     |
| duración              | entero                                                                                        | verdad    | ninguna       | ninguna     |
| descargable           | boolean                                                                                       | falso     | ninguna       | ninguna     |
| play\_count         | entero                                                                                        | verdad    | ninguna       | ninguna     |

### track\_artwork <a id="tocS_track_artwork"></a>

```json
{
  "150x150": "string",
  "480x480": "string",
  "1000x1000": "string"
}

```

#### Propiedades <a id="properties-7"></a>

| Nombre    | Tipo   | Requerido | Restricciones | Descripción |
|:--------- |:------ |:--------- |:------------- |:----------- |
| 150 x 150 | cadena | falso     | ninguna       | ninguna     |
| 480 x 480 | cadena | falso     | ninguna       | ninguna     |
| 1000x1000 | cadena | falso     | ninguna       | ninguna     |

### remix\_parent <a id="tocS_remix_parent"></a>

```json
{
  "tracks": [
    {
      "parent_track_id": "string"
    }
  ]
}

```

#### Propiedades <a id="properties-8"></a>

| Nombre | Tipo                                                                                    | Requerido | Restricciones | Descripción |
|:------ |:--------------------------------------------------------------------------------------- |:--------- |:------------- |:----------- |
| pistas | \[[pista](https://audiusproject.github.io/api-docs/?javascript#schematrack_element)\] | falso     | ninguna       | ninguna     |

### seguir\_elemento <a id="tocS_track_element"></a>

```json
{
  "parent_track_id": "string"
}

```

#### Propiedades <a id="properties-9"></a>

| Nombre                      | Tipo   | Requerido | Restricciones | Descripción |
|:--------------------------- |:------ |:--------- |:------------- |:----------- |
| parent\_seguimiento\_id | cadena | verdad    | ninguna       | ninguna     |

### reposts <a id="tocS_reposts"></a>

```json
{
  "data": [
    {
      "timestamp": "string",
      "item_type": {},
      "item": {}
    }
  ]
}

```

#### Propiedades <a id="properties-10"></a>

| Nombre | Tipo                                                                               | Requerido | Restricciones | Descripción |
|:------ |:---------------------------------------------------------------------------------- |:--------- |:------------- |:----------- |
| datos  | \[[pista](https://audiusproject.github.io/api-docs/?javascript#schemaactivity)\] | falso     | ninguna       | ninguna     |

### actividad <a id="tocS_activity"></a>

```json
{
  "timestamp": "string",
  "item_type": {},
  "item": {}
}

```

#### Propiedades <a id="properties-11"></a>

| Nombre           | Tipo   | Requerido | Restricciones | Descripción |
|:---------------- |:------ |:--------- |:------------- |:----------- |
| marca de tiempo  | cadena | falso     | ninguna       | ninguna     |
| elemento\_tipo | objeto | falso     | ninguna       | ninguna     |
| objeto           | objeto | falso     | ninguna       | ninguna     |

### favoritos\_respuesta <a id="tocS_favorites_response"></a>

```json
{
  "data": [
    {
      "favorite_item_id": "string",
      "favorite_type": "string",
      "user_id": "string"
    }
  ]
}

```

#### Propiedades <a id="properties-12"></a>

| Nombre | Tipo                                                                                  | Requerido | Restricciones | Descripción |
|:------ |:------------------------------------------------------------------------------------- |:--------- |:------------- |:----------- |
| datos  | \[[favorito](https://audiusproject.github.io/api-docs/?javascript#schemafavorite)\] | falso     | ninguna       | ninguna     |

### favorito <a id="tocS_favorite"></a>

```json
{
  "favorite_item_id": "string",
  "favorite_type": "string",
  "user_id": "string"
}

```

#### Propiedades <a id="properties-13"></a>

| Nombre                     | Tipo   | Requerido | Restricciones | Descripción |
|:-------------------------- |:------ |:--------- |:------------- |:----------- |
| favorito\_elemento\_id | cadena | verdad    | ninguna       | ninguna     |
| favorito\_tipo           | cadena | verdad    | ninguna       | ninguna     |
| usuario\_id              | cadena | verdad    | ninguna       | ninguna     |

### etiquetas\_respuesta <a id="tocS_tags_response"></a>

```json
{
  "data": [
    "string"
  ]
}

```

#### Propiedades <a id="properties-14"></a>

| Nombre | Tipo         | Requerido | Restricciones | Descripción |
|:------ |:------------ |:--------- |:------------- |:----------- |
| datos  | \[cadena\] | falso     | ninguna       | ninguna     |

### usuario\_búsqueda <a id="tocS_user_search"></a>

```json
{
  "data": [
    {
      "album_count": 0,
      "bio": "string",
      "cover_photo": {
        "640x": "string",
        "2000x": "string"
      },
      "followee_count": 0,
      "follower_count": 0,
      "handle": "string",
      "id": "string",
      "is_verified": true,
      "location": "string",
      "name": "string",
      "playlist_count": 0,
      "profile_picture": {
        "150x150": "string",
        "480x480": "string",
        "1000x1000": "string"
      },
      "repost_count": 0,
      "track_count": 0
    }
  ]
}
  ]
} zz

```

#### Propiedades <a id="properties-15"></a>

| Nombre | Tipo                                                                             | Requerido | Restricciones | Descripción |
|:------ |:-------------------------------------------------------------------------------- |:--------- |:------------- |:----------- |
| datos  | \[[usuario](https://audiusproject.github.io/api-docs/?javascript#schemauser)\] | falso     | ninguna       | ninguna     |

### playlist\_respuesta <a id="tocS_playlist_response"></a>

```json
{
  "data": [
    {
      "artwork": {
        "150x150": "string",
        "480x480": "string",
        "1000x1000": "string"
      },
      "description": "string",
      "id": "string",
      "is_album": true,
      "playlist_name": "string",
      "repost_count": 0,
      "favorite_count": 0,
      "total_play_count": 0,
      "user": {
        "album_count": 0,
        "bio": "string",
        "cover_photo": {
          "640x": "string",
          "2000x": "string"
        },
        "followee_count": 0,
        "follower_count": 0,
        "handle": "string",
        "id": "string",
        "is_verified": true,
        "location": "string",
        "name": "string",
        "playlist_count": 0,
        "profile_picture": {
          "150x150": "string",
          "480x480": "string",
          "1000x1000": "string"
        },
        "repost_count": 0,
        "track_count": 0
      }
    }
  ]
}

```

#### Propiedades <a id="properties-16"></a>

| Nombre | Tipo                                                                                               | Requerido | Restricciones | Descripción |
|:------ |:-------------------------------------------------------------------------------------------------- |:--------- |:------------- |:----------- |
| datos  | \[[lista de reproducción](https://audiusproject.github.io/api-docs/?javascript#schemaplaylist)\] | falso     | ninguna       | ninguna     |

### lista de reproducción <a id="tocS_playlist"></a>

```json
{
  "artwork": {
    "150x150": "string",
    "480x480": "string",
    "1000x1000": "string"
  },
  "description": "string",
  "id": "string",
  "is_album": true,
  "playlist_name": "string",
  "repost_count": 0,
  "favorite_count": 0,
  "total_play_count": 0,
  "user": {
    "album_count": 0,
    "bio": "string",
    "cover_photo": {
      "640x": "string",
      "2000x": "string"
    },
    "followee_count": 0,
    "follower_count": 0,
    "handle": "string",
    "id": "string",
    "is_verified": true,
    "location": "string",
    "name": "string",
    "playlist_count": 0,
    "profile_picture": {
      "150x150": "string",
      "480x480": "string",
      "1000x1000": "string"
    },
    "repost_count": 0,
    "track_count": 0
  }
}

```

#### Propiedades <a id="properties-17"></a>

| Nombre                  | Tipo                                                                                               | Requerido | Restricciones | Descripción |
|:----------------------- |:-------------------------------------------------------------------------------------------------- |:--------- |:------------- |:----------- |
| obra de arte            | [playlist\_artwork](https://audiusproject.github.io/api-docs/?javascript#schemaplaylist_artwork) | falso     | ninguna       | ninguna     |
| descripción             | cadena                                                                                             | falso     | ninguna       | ninguna     |
| id                      | cadena                                                                                             | verdad    | ninguna       | ninguna     |
| es\_álbum             | boolean                                                                                            | verdad    | ninguna       | ninguna     |
| playlist\_name        | cadena                                                                                             | verdad    | ninguna       | ninguna     |
| repost\_count         | entero                                                                                             | verdad    | ninguna       | ninguna     |
| contador de favoritos   | entero                                                                                             | verdad    | ninguna       | ninguna     |
| total\_play\_contar | entero                                                                                             | verdad    | ninguna       | ninguna     |
| usuario                 | [usuario](https://audiusproject.github.io/api-docs/?javascript#schemauser)                         | verdad    | ninguna       | ninguna     |

### playlist\_artwork <a id="tocS_playlist_artwork"></a>

```json
{
  "150x150": "string",
  "480x480": "string",
  "1000x1000": "string"
}

```

#### Propiedades <a id="properties-18"></a>

| Nombre    | Tipo   | Requerido | Restricciones | Descripción |
|:--------- |:------ |:--------- |:------------- |:----------- |
| 150 x 150 | cadena | falso     | ninguna       | ninguna     |
| 480 x 480 | cadena | falso     | ninguna       | ninguna     |
| 1000x1000 | cadena | falso     | ninguna       | ninguna     |

### playlist\_pistas\_respuesta <a id="tocS_playlist_tracks_response"></a>

```json
{
  "data": [
    {
      "artwork": {
        "150x150": "string",
        "480x480": "string",
        "1000x1000": "string"
      },
      "description": "string",
      "genre": "string",
      "id": "string",
      "mood": "string",
      "release_date": "string",
      "remix_of": {
        "tracks": [
          {
            "parent_track_id": "string"
          }
        ]
      },
      "repost_count": 0,
      "favorite_count": 0,
      "tags": "string",
      "title": "string",
      "user": {
        "album_count": 0,
        "bio": "string",
        "cover_photo": {
          "640x": "string",
          "2000x": "string"
        },
        "followee_count": 0,
        "follower_count": 0,
        "handle": "string",
        "id": "string",
        "is_verified": true,
        "location": "string",
        "name": "string",
        "playlist_count": 0,
        "profile_picture": {
          "150x150": "string",
          "480x480": "string",
          "1000x1000": "string"
        },
        "repost_count": 0,
        "track_count": 0
      },
      "duration": 0,
      "downloadable": true,
      "play_count": 0
    }
  ]
}

```

#### Propiedades <a id="properties-19"></a>

| Nombre | Tipo                                                                            | Requerido | Restricciones | Descripción |
|:------ |:------------------------------------------------------------------------------- |:--------- |:------------- |:----------- |
| datos  | \[[Pista](https://audiusproject.github.io/api-docs/?javascript#schematrack)\] | falso     | ninguna       | ninguna     |

### playlist\_search\_result <a id="tocS_playlist_search_result"></a>

```json
{
  "data": [
    {
      "artwork": {
        "150x150": "string",
        "480x480": "string",
        "1000x1000": "string"
      },
      "description": "string",
      "id": "string",
      "is_album": true,
      "playlist_name": "string",
      "repost_count": 0,
      "favorite_count": 0,
      "total_play_count": 0,
      "user": {
        "album_count": 0,
        "bio": "string",
        "cover_photo": {
          "640x": "string",
          "2000x": "string"
        },
        "followee_count": 0,
        "follower_count": 0,
        "handle": "string",
        "id": "string",
        "is_verified": true,
        "location": "string",
        "name": "string",
        "playlist_count": 0,
        "profile_picture": {
          "150x150": "string",
          "480x480": "string",
          "1000x1000": "string"
        },
        "repost_count": 0,
        "track_count": 0
      }
    }
  ]
}

```

#### Propiedades <a id="properties-20"></a>

| Nombre | Tipo                                                                                               | Requerido | Restricciones | Descripción |
|:------ |:-------------------------------------------------------------------------------------------------- |:--------- |:------------- |:----------- |
| datos  | \[[lista de reproducción](https://audiusproject.github.io/api-docs/?javascript#schemaplaylist)\] | falso     | ninguna       | ninguna     |

### pistas\_respuesta <a id="tocS_track_response"></a>

```json
{
  "data": {
    "artwork": {
      "150x150": "string",
      "480x480": "string",
      "1000x1000": "string"
    },
    "description": "string",
    "genre": "string",
    "id": "string",
    "mood": "string",
    "release_date": "string",
    "remix_of": {
      "tracks": [
        {
          "parent_track_id": "string"
        }
      ]
    },
    "repost_count": 0,
    "favorite_count": 0,
    "tags": "string",
    "title": "string",
    "user": {
      "album_count": 0,
      "bio": "string",
      "cover_photo": {
        "640x": "string",
        "2000x": "string"
      },
      "followee_count": 0,
      "follower_count": 0,
      "handle": "string",
      "id": "string",
      "is_verified": true,
      "location": "string",
      "name": "string",
      "playlist_count": 0,
      "profile_picture": {
        "150x150": "string",
        "480x480": "string",
        "1000x1000": "string"
      },
      "repost_count": 0,
      "track_count": 0
    },
    "duration": 0,
    "downloadable": true,
    "play_count": 0
  }
}

```

#### Propiedades <a id="properties-21"></a>

| Nombre | Tipo                                                                      | Requerido | Restricciones | Descripción |
|:------ |:------------------------------------------------------------------------- |:--------- |:------------- |:----------- |
| datos  | [Pista](https://audiusproject.github.io/api-docs/?javascript#schematrack) | falso     | ninguna       | ninguna     |

### track\_buscar <a id="tocS_track_search"></a>

```json
{
  "data": [
    {
      "artwork": {
        "150x150": "string",
        "480x480": "string",
        "1000x1000": "string"
      },
      "description": "string",
      "genre": "string",
      "id": "string",
      "mood": "string",
      "release_date": "string",
      "remix_of": {
        "tracks": [
          {
            "parent_track_id": "string"
          }
        ]
      },
      "repost_count": 0,
      "favorite_count": 0,
      "tags": "string",
      "title": "string",
      "user": {
        "album_count": 0,
        "bio": "string",
        "cover_photo": {
          "640x": "string",
          "2000x": "string"
        },
        "followee_count": 0,
        "follower_count": 0,
        "handle": "string",
        "id": "string",
        "is_verified": true,
        "location": "string",
        "name": "string",
        "playlist_count": 0,
        "profile_picture": {
          "150x150": "string",
          "480x480": "string",
          "1000x1000": "string"
        },
        "repost_count": 0,
        "track_count": 0
      },
      "duration": 0,
      "downloadable": true,
      "play_count": 0
    }
  ]
}

```

#### Propiedades <a id="properties-22"></a>

| Nombre | Estilo                                                                          | Requerido | Restricciones | Descripción |
|:------ |:------------------------------------------------------------------------------- |:--------- |:------------- |:----------- |
| datos  | \[[Pista](https://audiusproject.github.io/api-docs/?javascript#schematrack)\] | falso     | ninguna       | ninguna     |

### app\_name\_trailing\_response <a id="tocS_app_name_trailing_response"></a>

```json
{
  "data": [
    {
      "count": 0,
      "name": "string"
    }
  ]
}

```

#### Propiedades <a id="properties-23"></a>

| Nombre | Tipo                                                                                                                           | Requerido | Restricciones | Descripción |
|:------ |:------------------------------------------------------------------------------------------------------------------------------ |:--------- |:------------- |:----------- |
| datos  | \[[app\_name\_trailing\_metric](https://audiusproject.github.io/api-docs/?javascript#schemaapp_name_trailing_metric)\] | falso     | ninguna       | ninguna     |

### app\_name\_trailing\_metric <a id="tocS_app_name_trailing_metric"></a>

```json
{
  "count": 0,
  "name": "string"
}

```

#### Propiedades <a id="properties-24"></a>

| Nombre   | Tipo   | Requerido | Restricciones | Descripción |
|:-------- |:------ |:--------- |:------------- |:----------- |
| contador | entero | falso     | ninguna       | ninguna     |
| nombre   | cadena | falso     | ninguna       | ninguna     |
