

<h1 id="api-users">usuarios</h1>

## Obtener el id del usuario por billetera asociada

<a id="opIdGet the User's id by associated wallet"></a>

> Muestra de código

```shell
curl AUDIUS_API_HOST/v1/users/associated_wallets?id=string 


```

```http
GET AUDIUS_API_HOST/v1/users/associated_wallets?id=string HTTP/1.1

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('AUDIUS_API_HOST/v1/users/associated_wallets?id=string',
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

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get 'AUDIUS_API_HOST/v1/users/associated_wallets',
  params: {
  'id' => 'string'
}, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('AUDIUS_API_HOST/v1/users/associated_wallets', params={
  'id': 'string'
}, headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','AUDIUS_API_HOST/v1/users/associated_wallets', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("AUDIUS_API_HOST/v1/users/associated_wallets?id=string");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "AUDIUS_API_HOST/v1/users/associated_wallets", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /users/associated_wallets`

<h3 id="get-the-user's-id-by-associated-wallet-parameters">Parámetros de consulta</h3>

| Nombre | Tipo   | Requerido | Descripción              |
| ------ | ------ | --------- | ------------------------ |
| id     | cadena | verdad    | ID de usuario codificado |

> Ejemplo de respuesta

> 200 Respuesta

```json
{
  "data": {
    "wallets": [
      "string"
    ],
    "sol_wallets": [
      "string"
    ]
  }
}
```

<h3 id="get-the-user's-id-by-associated-wallet-responses">Respuestas</h3>

| Estado | Significado                                                                     | Descripción          | Esquema                                                             |
| ------ | ------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------- |
| 200    | [Ok](https://tools.ietf.org/html/rfc7231#section-6.3.1)                         | Exitoso              | [associated_wallets_response](#schemaassociated_wallets_response) |
| 400    | [Solicitud incorrecta](https://tools.ietf.org/html/rfc7231#section-6.5.1)       | Solicitud incorrecta | Ninguna                                                             |
| 500    | [Error interno del servidor](https://tools.ietf.org/html/rfc7231#section-6.6.1) | Error del servidor   | Ninguna                                                             |

## Obtener las billeteras asociadas del usuario

<a id="opIdGet the User's associated wallets"></a>

> Muestra de código

```shell
curl AUDIUS_API_HOST/v1/users/id?associated_wallet=string 


```

```http
GET AUDIUS_API_HOST/v1/users/id?associated_wallet=string HTTP/1.1

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('AUDIUS_API_HOST/v1/users/id?associated_wallet=string',
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

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get 'AUDIUS_API_HOST/v1/users/id',
  params: {
  'associated_wallet' => 'string'
}, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('AUDIUS_API_HOST/v1/users/id', params={
  'associated_wallet': 'string'
}, headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','AUDIUS_API_HOST/v1/users/id', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("AUDIUS_API_HOST/v1/users/id?associated_wallet=string");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "AUDIUS_API_HOST/v1/users/id", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /users/id`

<h3 id="get-the-user's-associated-wallets-parameters">Parámetros de consulta</h3>

| Nombre            | Tipo   | Requerido | Descripción            |
| ----------------- | ------ | --------- | ---------------------- |
| monedero_asociado | cadena | verdad    | Dirección del monedero |

> Ejemplo de respuesta

> 200 Respuesta

```json
{
  "data": {
    "user_id": "string"
  }
}
```

<h3 id="get-the-user's-associated-wallets-responses">Respuestas</h3>

| Estado | Significado                                                                     | Descripción          | Esquema                                                                 |
| ------ | ------------------------------------------------------------------------------- | -------------------- | ----------------------------------------------------------------------- |
| 200    | [Ok](https://tools.ietf.org/html/rfc7231#section-6.3.1)                         | Exitoso              | [respuesta_monedero_asociado](#schemauser_associated_wallet_response) |
| 400    | [Solicitud incorrecta](https://tools.ietf.org/html/rfc7231#section-6.5.1)       | Solicitud incorrecta | Ninguna                                                                 |
| 500    | [Error interno del servidor](https://tools.ietf.org/html/rfc7231#section-6.6.1) | Error del servidor   | Ninguna                                                                 |

## Buscar usuarios

<a id="opIdSearch Users"></a>

> Muestra de código

```shell
curl AUDIUS_API_HOST/v1/users/search?query=Brownies 


```

```http
GET AUDIUS_API_HOST/v1/users/search?query=Brownies HTTP/1.1

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('AUDIUS_API_HOST/v1/users/search?query=Brownies',
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

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get 'AUDIUS_API_HOST/v1/users/search',
  params: {
  'query' => 'string'
}, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('AUDIUS_API_HOST/v1/users/search', params={
  'query': 'Brownies'
}, headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','AUDIUS_API_HOST/v1/users/search', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("AUDIUS_API_HOST/v1/users/search?query=Brownies");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "AUDIUS_API_HOST/v1/users/search", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`Obtener /usuarios/buscar`

*Buscar un usuario*

<h3 id="search-users-parameters">Parámetros de consulta</h3>

| Nombre           | Tipo   | Requerido | Descripción     |
| ---------------- | ------ | --------- | --------------- |
| consulta         | cadena | verdad    | Buscar consulta |
| sólo_descargable | cadena | falso     | ninguna         |

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

<h3 id="search-users-responses">Respuestas</h3>

| Estado | Significado                                                                     | Descripción          | Esquema                                |
| ------ | ------------------------------------------------------------------------------- | -------------------- | -------------------------------------- |
| 200    | [Ok](https://tools.ietf.org/html/rfc7231#section-6.3.1)                         | ninguna              | [usuario_búsqueda](#schemauser_search) |
| 400    | [Solicitud incorrecta](https://tools.ietf.org/html/rfc7231#section-6.5.1)       | Solicitud incorrecta | Ninguna                                |
| 500    | [Error interno del servidor](https://tools.ietf.org/html/rfc7231#section-6.6.1) | Error del servidor   | Ninguna                                |

## Obtener usuario

<a id="opIdGet User"></a>

> Muestra de código

```shell
curl AUDIUS_API_HOST/v1/users/nlGNe 


```

```http
GET AUDIUS_API_HOST/v1/users/nlGNe HTTP/1.1

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('AUDIUS_API_HOST/v1/users/nlGNe',
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

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get 'AUDIUS_API_HOST/v1/users/nlGNe',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('AUDIUS_API_HOST/v1/users/nlGNe', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','AUDIUS_API_HOST/v1/users/nlGNe', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("AUDIUS_API_HOST/v1/users/nlGNe");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "AUDIUS_API_HOST/v1/users/nlGNe", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /users/{user_id}`

*Obtener un único usuario*

<h3 id="get-user-parameters">Parámetros de consulta</h3>

| Nombre     | Tipo   | Requerido | Descripción      |
| ---------- | ------ | --------- | ---------------- |
| usuario_id | cadena | verdad    | Un ID de usuario |

> Ejemplo de respuesta

```json
{
  "data": {
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
```

<h3 id="get-user-responses">Respuestas</h3>

| Estado | Significado                                                                     | Descripción          | Esquema                                   |
| ------ | ------------------------------------------------------------------------------- | -------------------- | ----------------------------------------- |
| 200    | [Ok](https://tools.ietf.org/html/rfc7231#section-6.3.1)                         | ninguna              | [usuario_respuesta](#schemauser_response) |
| 400    | [Solicitud incorrecta](https://tools.ietf.org/html/rfc7231#section-6.5.1)       | Solicitud incorrecta | Ninguna                                   |
| 500    | [Error interno del servidor](https://tools.ietf.org/html/rfc7231#section-6.6.1) | Error del servidor   | Ninguna                                   |

## ID de los usuarios

<a id="opIdThe users's ID"></a>

> Muestra de código

```shell
curl AUDIUS_API_HOST/v1/users/string/challenges 


```

```http
GET AUDIUS_API_HOST/v1/users/string/challenges HTTP/1.1

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('AUDIUS_API_HOST/v1/users/string/challenges',
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

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get 'AUDIUS_API_HOST/v1/users/string/challenges',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('AUDIUS_API_HOST/v1/users/string/challenges', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','AUDIUS_API_HOST/v1/users/string/challenges', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("AUDIUS_API_HOST/v1/users/string/challenges");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "AUDIUS_API_HOST/v1/users/string/challenges", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /users/{user_id}/challenges`

<h3 id="the-users's-id-parameters">Parámetros de consulta</h3>

| Nombre            | Tipo   | Requerido | Descripción                                            |
| ----------------- | ------ | --------- | ------------------------------------------------------ |
| mostrar_histórico | cadena | falso     | Si se muestran los desafíos inactivos pero completados |
| usuario_id        | cadena | verdad    | ninguna                                                |

> Ejemplo de respuesta

> 200 Respuesta

```json
{
  "data": [
    {
      "challenge_id": "string",
      "user_id": "string",
      "specifier": "string",
      "is_complete": true,
      "is_active": true,
      "is_disbursed": true,
      "current_step_count": 0,
      "max_steps": 0,
      "challenge_type": "string",
      "metadata": {}
    }
  ]
}
```

<h3 id="the-users's-id-responses">Respuestas</h3>

| Estado | Significado                                                                     | Descripción          | Esquema                                 |
| ------ | ------------------------------------------------------------------------------- | -------------------- | --------------------------------------- |
| 200    | [Ok](https://tools.ietf.org/html/rfc7231#section-6.3.1)                         | Exitoso              | [get_challenges](#schemaget_challenges) |
| 400    | [Solicitud incorrecta](https://tools.ietf.org/html/rfc7231#section-6.5.1)       | Solicitud incorrecta | Ninguna                                 |
| 500    | [Error interno del servidor](https://tools.ietf.org/html/rfc7231#section-6.6.1) | Error del servidor   | Ninguna                                 |

## Obtener pistas favoritas del usuario

<a id="opIdGet User's Favorite Tracks"></a>

> Muestra de código

```shell
curl AUDIUS_API_HOST/v1/users/nlGNe/favorites 


```

```http
GET AUDIUS_API_HOST/v1/users/nlGNe/favorites HTTP/1.1

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('AUDIUS_API_HOST/v1/users/nlGNe/favorites',
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

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get 'AUDIUS_API_HOST/v1/users/nlGNe/favorites',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('AUDIUS_API_HOST/v1/users/nlGNe/favorites', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','AUDIUS_API_HOST/v1/users/nlGNe/favorites', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("AUDIUS_API_HOST/v1/users/nlGNe/favorites");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "AUDIUS_API_HOST/v1/users/nlGNe/favorites", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /users/{user_id}/favoritos`

*Obtener las pistas favoritas para un usuario*

<h3 id="get-user's-favorite-tracks-parameters">Parámetros de consulta</h3>

| Nombre     | Tipo   | Requerido | Descripción      |
| ---------- | ------ | --------- | ---------------- |
| usuario_id | cadena | verdad    | Un ID de usuario |

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

<h3 id="get-user's-favorite-tracks-responses">Respuestas</h3>

| Estado | Significado                                                                     | Descripción          | Esquema                                          |
| ------ | ------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------ |
| 200    | [Ok](https://tools.ietf.org/html/rfc7231#section-6.3.1)                         | ninguna              | [favoritos_respuesta](#schemafavorites_response) |
| 400    | [Solicitud incorrecta](https://tools.ietf.org/html/rfc7231#section-6.5.1)       | Solicitud incorrecta | Ninguna                                          |
| 500    | [Error interno del servidor](https://tools.ietf.org/html/rfc7231#section-6.6.1) | Error del servidor   | Ninguna                                          |

## Obtener reposts de usuario

<a id="opIdGet User's Reposts"></a>

> Muestra de código

```shell
curl AUDIUS_API_HOST/v1/users/string/reposts 


```

```http
GET AUDIUS_API_HOST/v1/users/string/reposts HTTP/1.1

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('AUDIUS_API_HOST/v1/users/string/reposts',
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

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get 'AUDIUS_API_HOST/v1/users/string/reposts',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('AUDIUS_API_HOST/v1/users/string/reposts', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','AUDIUS_API_HOST/v1/users/string/reposts', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("AUDIUS_API_HOST/v1/users/string/reposts");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "AUDIUS_API_HOST/v1/users/string/reposts", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`Obtener /usuarios/{user_id}/reposts`

<h3 id="get-user's-reposts-parameters">Parámetros de consulta</h3>

| Nombre     | Tipo   | Requerido | Descripción      |
| ---------- | ------ | --------- | ---------------- |
| usuario_id | cadena | verdad    | Un ID de usuario |
| límite     | cadena | falso     | Límite           |
| offset     | cadena | falso     | Offset           |

> Ejemplo de respuesta

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

<h3 id="get-user's-reposts-responses">Respuestas</h3>

| Estado | Significado                                                                     | Descripción          | Esquema                   |
| ------ | ------------------------------------------------------------------------------- | -------------------- | ------------------------- |
| 200    | [Ok](https://tools.ietf.org/html/rfc7231#section-6.3.1)                         | Exitoso              | [reposts](#schemareposts) |
| 400    | [Solicitud incorrecta](https://tools.ietf.org/html/rfc7231#section-6.5.1)       | Solicitud incorrecta | Ninguna                   |
| 500    | [Error interno del servidor](https://tools.ietf.org/html/rfc7231#section-6.6.1) | Error del servidor   | Ninguna                   |

## Obtén las etiquetas de pista más utilizadas del usuario

<a id="opIdGet User's Most Used Track Tags"></a>

> Muestra de código

```shell
curl AUDIUS_API_HOST/v1/users/string/tags?user_id=string 


```

```http
GET AUDIUS_API_HOST/v1/users/string/tags?user_id=string HTTP/1.1

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('AUDIUS_API_HOST/v1/users/string/tags?user_id=string',
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

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get 'AUDIUS_API_HOST/v1/users/string/tags',
  params: {
  'user_id' => 'string'
}, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('AUDIUS_API_HOST/v1/users/string/tags', params={
  'user_id': 'string'
}, headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','AUDIUS_API_HOST/v1/users/string/tags', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("AUDIUS_API_HOST/v1/users/string/tags?user_id=string");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "AUDIUS_API_HOST/v1/users/string/tags", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /users/{user_id}/tags`

*Obtener etiquetas más usadas en las pistas del usuario*

<h3 id="get-user's-most-used-track-tags-parameters">Parámetros de consulta</h3>

| Nombre     | Tipo   | Requerido | Descripción                    |
| ---------- | ------ | --------- | ------------------------------ |
| usuario_id | cadena | verdad    | Un ID de usuario               |
| límite     | entero | falso     | Limitar el número de etiquetas |
| usuario_id | cadena | verdad    | ninguna                        |

> Ejemplo de respuesta

> 200 Respuesta

```json
{
  "data": [
    "string"
  ]
}
```

<h3 id="get-user's-most-used-track-tags-responses">Respuestas</h3>

| Estado | Significado                                                                     | Descripción          | Esquema                                     |
| ------ | ------------------------------------------------------------------------------- | -------------------- | ------------------------------------------- |
| 200    | [Ok](https://tools.ietf.org/html/rfc7231#section-6.3.1)                         | Exitoso              | [etiquetas_respuesta](#schematags_response) |
| 400    | [Solicitud incorrecta](https://tools.ietf.org/html/rfc7231#section-6.5.1)       | Solicitud incorrecta | Ninguna                                     |
| 500    | [Error interno del servidor](https://tools.ietf.org/html/rfc7231#section-6.6.1) | Error del servidor   | Ninguna                                     |

## Obtener pistas de usuario

<a id="opIdGet User's Tracks"></a>

> Muestra de código

```shell
curl AUDIUS_API_HOST/v1/users/nlGNe/tracks 


```

```http
GET AUDIUS_API_HOST/v1/users/nlGNe/tracks HTTP/1.1

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('AUDIUS_API_HOST/v1/users/nlGNe/tracks',
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

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get 'AUDIUS_API_HOST/v1/users/nlGNe/tracks',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('AUDIUS_API_HOST/v1/users/nlGNe/tracks', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','AUDIUS_API_HOST/v1/users/nlGNe/tracks', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("AUDIUS_API_HOST/v1/users/nlGNe/tracks");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "AUDIUS_API_HOST/v1/users/nlGNe/tracks", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /users/{user_id}/tracks`

*Obtener una lista de pistas para un usuario*

<h3 id="get-user's-tracks-parameters">Parámetros de consulta</h3>

| Nombre     | Tipo   | Requerido | Descripción      |
| ---------- | ------ | --------- | ---------------- |
| usuario_id | cadena | verdad    | Un ID de usuario |
| límite     | cadena | falso     | Límite           |
| offset     | cadena | falso     | Offset           |
| ordenar    | cadena | falso     | Ordenar modo     |

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

<h3 id="get-user's-tracks-responses">Respuestas</h3>

| Estado | Significado                                                                     | Descripción          | Esquema                                   |
| ------ | ------------------------------------------------------------------------------- | -------------------- | ----------------------------------------- |
| 200    | [Ok](https://tools.ietf.org/html/rfc7231#section-6.3.1)                         | ninguna              | [tracks_response](#schematracks_response) |
| 400    | [Solicitud incorrecta](https://tools.ietf.org/html/rfc7231#section-6.5.1)       | Solicitud incorrecta | Ninguna                                   |
| 500    | [Error interno del servidor](https://tools.ietf.org/html/rfc7231#section-6.6.1) | Error del servidor   | Ninguna                                   |

<h1 id="api-playlists">lista de reproducción</h1>

## Buscar listas de reproducción

<a id="opIdSearch Playlists"></a>

> Muestra de código

```shell
curl AUDIUS_API_HOST/v1/playlists/search?query=Hot & New 


```

```http
GET AUDIUS_API_HOST/v1/playlists/search?query=Hot & New HTTP/1.1

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('AUDIUS_API_HOST/v1/playlists/search?query=Hot & New',
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

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get 'AUDIUS_API_HOST/v1/playlists/search',
  params: {
  'query' => 'string'
}, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('AUDIUS_API_HOST/v1/playlists/search', params={
  'query': 'Hot & New'
}, headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','AUDIUS_API_HOST/v1/playlists/search', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("AUDIUS_API_HOST/v1/playlists/search?query=Hot & New");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "AUDIUS_API_HOST/v1/playlists/search", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`Obtener /Listas de reproducción/buscar`

*Buscar una lista de reproducción*

<h3 id="search-playlists-parameters">Parámetros de consulta</h3>

| Nombre           | Tipo   | Requerido | Descripción |
| ---------------- | ------ | --------- | ----------- |
| consulta         | cadena | verdad    | Búsqueda    |
| sólo_descargable | cadena | falso     | ninguna     |

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
        "bio": "The official Audius account! Creating a decentralized and open-source streaming music platform controlled by artists, fans, & developers.",
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

<h3 id="search-playlists-responses">Respuestas</h3>

| Estado | Significado                                                                     | Descripción          | Esquema                                                        |
| ------ | ------------------------------------------------------------------------------- | -------------------- | -------------------------------------------------------------- |
| 200    | [Ok](https://tools.ietf.org/html/rfc7231#section-6.3.1)                         | ninguna              | [playlist_resultado_búsqueda](#schemaplaylist_search_result) |
| 400    | [Solicitud incorrecta](https://tools.ietf.org/html/rfc7231#section-6.5.1)       | Solicitud incorrecta | Ninguna                                                        |
| 500    | [Error interno del servidor](https://tools.ietf.org/html/rfc7231#section-6.6.1) | Error del servidor   | Ninguna                                                        |

## Listas de reproducción populares

<a id="opIdTrending Playlists"></a>

> Muestra de código

```shell
curl AUDIUS_API_HOST/v1/playlists/trending/string 


```

```http
GET AUDIUS_API_HOST/v1/playlists/trending/string HTTP/1.1

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('AUDIUS_API_HOST/v1/playlists/trending/string',
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

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get 'AUDIUS_API_HOST/v1/playlists/trending/string',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('AUDIUS_API_HOST/v1/playlists/trending/string', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','AUDIUS_API_HOST/v1/playlists/trending/string', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("AUDIUS_API_HOST/v1/playlists/trending/string");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "AUDIUS_API_HOST/v1/playlists/trending/string", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /playlists/trending/{version}`

*Obtiene las listas de reproducción que más tienden a aparecer en el período de tiempo en Audius*

<h3 id="trending-playlists-parameters">Parámetros de consulta</h3>

| Nombre    | Tipo   | Requerido | Descripción                     |
| --------- | ------ | --------- | ------------------------------- |
| tiempo    | cadena | falso     | intervalo de tiempo a consultar |
| versiones | cadena | verdad    | ninguna                         |

> Ejemplo de respuesta

> 200 Respuesta

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

<h3 id="trending-playlists-responses">Respuestas</h3>

| Estado | Significado                                                                     | Descripción          | Esquema                                                                       |
| ------ | ------------------------------------------------------------------------------- | -------------------- | ----------------------------------------------------------------------------- |
| 200    | [Ok](https://tools.ietf.org/html/rfc7231#section-6.3.1)                         | Exitoso              | [respuesta de las listas de reproducción](#schematrending_playlists_response) |
| 400    | [Solicitud incorrecta](https://tools.ietf.org/html/rfc7231#section-6.5.1)       | Solicitud incorrecta | Ninguna                                                                       |
| 500    | [Error interno del servidor](https://tools.ietf.org/html/rfc7231#section-6.6.1) | Error del servidor   | Ninguna                                                                       |

## Obtener playlist

<a id="opIdGet Playlist"></a>

> Muestra de código

```shell
curl AUDIUS_API_HOST/v1/playlists/DOPRl 


```

```http
GET AUDIUS_API_HOST/v1/playlists/DOPRl HTTP/1.1

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('AUDIUS_API_HOST/v1/playlists/DOPRl',
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

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get 'AUDIUS_API_HOST/v1/playlists/DOPRl',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('AUDIUS_API_HOST/v1/playlists/DOPRl', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','AUDIUS_API_HOST/v1/playlists/DOPRl', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("AUDIUS_API_HOST/v1/playlists/DOPRl");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "AUDIUS_API_HOST/v1/playlists/DOPRl", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`OBTENER /playlists/{playlist_id}`

*Buscar una lista*

<h3 id="get-playlist-parameters">Parámetros de consulta</h3>

| Nombre      | Tipo   | Requerido | Descripción                    |
| ----------- | ------ | --------- | ------------------------------ |
| playlist_id | cadena | verdad    | Un ID de lista de reproducción |

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
      "bio": "The official Audius account! Creating a decentralized and open-source streaming music platform controlled by artists, fans, & developers.",
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
}
```

<h3 id="get-playlist-responses">Respuestas</h3>

| Estado | Significado                                                                     | Descripción          | Esquema                                        |
| ------ | ------------------------------------------------------------------------------- | -------------------- | ---------------------------------------------- |
| 200    | [Ok](https://tools.ietf.org/html/rfc7231#section-6.3.1)                         | ninguna              | [playlist_respuesta](#schemaplaylist_response) |
| 400    | [Solicitud incorrecta](https://tools.ietf.org/html/rfc7231#section-6.5.1)       | Solicitud incorrecta | Ninguna                                        |
| 500    | [Error interno del servidor](https://tools.ietf.org/html/rfc7231#section-6.6.1) | Error del servidor   | Ninguna                                        |

## Obtener pistas de lista de reproducción

<a id="opIdGet Playlist Tracks"></a>

> Muestra de código

```shell
curl AUDIUS_API_HOST/v1/playlists/DOPRl/tracks 


```

```http
GET AUDIUS_API_HOST/v1/playlists/DOPRl/tracks HTTP/1.1

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('AUDIUS_API_HOST/v1/playlists/DOPRl/tracks',
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

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get 'AUDIUS_API_HOST/v1/playlists/DOPRl/tracks',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('AUDIUS_API_HOST/v1/playlists/DOPRl/tracks', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','AUDIUS_API_HOST/v1/playlists/DOPRl/tracks', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("AUDIUS_API_HOST/v1/playlists/DOPRl/tracks");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "AUDIUS_API_HOST/v1/playlists/DOPRl/tracks", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`OBTENER /listas de reproducción/{playlist_id}/pistas`

*Obtener pistas dentro de una lista de reproducción*

<h3 id="get-playlist-tracks-parameters">Parámetros de consulta</h3>

| Nombre      | Tipo   | Requerido | Descripción                    |
| ----------- | ------ | --------- | ------------------------------ |
| playlist_id | cadena | verdad    | Un ID de lista de reproducción |

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

<h3 id="get-playlist-tracks-responses">Respuestas</h3>

| Estado | Significado                                                                     | Descripción          | Esquema                                                         |
| ------ | ------------------------------------------------------------------------------- | -------------------- | --------------------------------------------------------------- |
| 200    | [Ok](https://tools.ietf.org/html/rfc7231#section-6.3.1)                         | ninguna              | [playlist_pistas_respuesta_](#schemaplaylist_tracks_response) |
| 400    | [Solicitud incorrecta](https://tools.ietf.org/html/rfc7231#section-6.5.1)       | Solicitud incorrecta | Ninguna                                                         |
| 500    | [Error interno del servidor](https://tools.ietf.org/html/rfc7231#section-6.6.1) | Error del servidor   | Ninguna                                                         |

<h1 id="api-tracks">pistas</h1>

## Obtener pistas de forma manual y Slug

<a id="opIdGet Track By Handle and Slug"></a>

> Muestra de código

```shell
curl AUDIUS_API_HOST/v1/tracks 


```

```http
GET AUDIUS_API_HOST/v1/tracks HTTP/1.1

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('AUDIUS_API_HOST/v1/tracks',
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

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get 'AUDIUS_API_HOST/v1/tracks',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('AUDIUS_API_HOST/v1/tracks', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','AUDIUS_API_HOST/v1/tracks', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("AUDIUS_API_HOST/v1/tracks");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "AUDIUS_API_HOST/v1/tracks", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`Obtener /tracks`

<h3 id="get-track-by-handle-and-slug-parameters">Parámetros de consulta</h3>

| Nombre | Tipo   | Requerido | Descripción          |
| ------ | ------ | --------- | -------------------- |
| manejo | cadena | falso     | Manejo de un usuario |
| slug   | cadena | falso     | Slug de la pista     |

> Ejemplo de respuesta

> 200 Respuesta

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
    "play_count": 0,
    "permalink": "string"
  }
}
```

<h3 id="get-track-by-handle-and-slug-responses">Respuestas</h3>

| Estado | Significado                                                                     | Descripción          | Esquema                                 |
| ------ | ------------------------------------------------------------------------------- | -------------------- | --------------------------------------- |
| 200    | [Ok](https://tools.ietf.org/html/rfc7231#section-6.3.1)                         | Exitoso              | [track_response](#schematrack_response) |
| 400    | [Solicitud incorrecta](https://tools.ietf.org/html/rfc7231#section-6.5.1)       | Solicitud incorrecta | Ninguna                                 |
| 500    | [Error interno del servidor](https://tools.ietf.org/html/rfc7231#section-6.6.1) | Error del servidor   | Ninguna                                 |

## Pistas Recomendadas

<a id="opIdRecommended Tracks"></a>

> Muestra de código

```shell
curl AUDIUS_API_HOST/v1/tracks/recommended/string 


```

```http
GET AUDIUS_API_HOST/v1/tracks/recommended/string HTTP/1.1

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('AUDIUS_API_HOST/v1/tracks/recommended/string',
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

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get 'AUDIUS_API_HOST/v1/tracks/recommended/string',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('AUDIUS_API_HOST/v1/tracks/recommended/string', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','AUDIUS_API_HOST/v1/tracks/recommended/string', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("AUDIUS_API_HOST/v1/tracks/recommended/string");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "AUDIUS_API_HOST/v1/tracks/recommended/string", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /tracks/recommended/{version}`

<h3 id="recommended-tracks-parameters">Parámetros de consulta</h3>

| Nombre             | Tipo   | Requerido | Descripción                                                                  |
| ------------------ | ------ | --------- | ---------------------------------------------------------------------------- |
| género             | cadena | falso     | Tracks de tendencia recomendados para un género especificado                 |
| límite             | cadena | falso     | Número de pistas recomendadas a buscar                                       |
| lista de exclusión | cadena | falso     | Lista de identificadores de pista a excluir                                  |
| tiempo             | cadena | falso     | Pistas populares en un rango de tiempo especificado \(semana, mes, allTime) |
| versiones          | cadena | verdad    | ninguna                                                                      |

> Ejemplo de respuesta

> 200 Respuesta

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
      "play_count": 0,
      "permalink": "string"
    }
  ]
}
```

<h3 id="recommended-tracks-responses">Respuestas</h3>

| Estado | Significado                                                                     | Descripción          | Esquema                                   |
| ------ | ------------------------------------------------------------------------------- | -------------------- | ----------------------------------------- |
| 200    | [Ok](https://tools.ietf.org/html/rfc7231#section-6.3.1)                         | Exitoso              | [tracks_response](#schematracks_response) |
| 400    | [Solicitud incorrecta](https://tools.ietf.org/html/rfc7231#section-6.5.1)       | Solicitud incorrecta | Ninguna                                   |
| 500    | [Error interno del servidor](https://tools.ietf.org/html/rfc7231#section-6.6.1) | Error del servidor   | Ninguna                                   |

## Buscar pistas

<a id="opIdSearch Tracks"></a>

> Muestra de código

```shell
curl AUDIUS_API_HOST/v1/tracks/search?query=baauer b2b 


```

```http
GET AUDIUS_API_HOST/v1/tracks/search?query=baauer b2b HTTP/1.1

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('AUDIUS_API_HOST/v1/tracks/search?query=baauer b2b',
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

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get 'AUDIUS_API_HOST/v1/tracks/search',
  params: {
  'query' => 'string'
}, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('AUDIUS_API_HOST/v1/tracks/search', params={
  'query': 'baauer b2b'
}, headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','AUDIUS_API_HOST/v1/tracks/search', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("AUDIUS_API_HOST/v1/tracks/search?query=baauer b2b");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "AUDIUS_API_HOST/v1/tracks/search", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`Obtener /pistas/búsqueda`

*Buscar un track*

<h3 id="search-tracks-parameters">Parámetros de consulta</h3>

| Nombre           | Tipo   | Requerido | Descripción                       |
| ---------------- | ------ | --------- | --------------------------------- |
| consulta         | cadena | verdad    | Búsqueda                          |
| sólo_descargable | cadena | falso     | Devolver sólo pistas descargables |

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

<h3 id="search-tracks-responses">Respuestas</h3>

| Estado | Significado                                                                     | Descripción          | Esquema                                     |
| ------ | ------------------------------------------------------------------------------- | -------------------- | ------------------------------------------- |
| 200    | [Ok](https://tools.ietf.org/html/rfc7231#section-6.3.1)                         | ninguna              | [búsqueda_seguimiento](#schematrack_search) |
| 400    | [Solicitud incorrecta](https://tools.ietf.org/html/rfc7231#section-6.5.1)       | Solicitud incorrecta | Ninguna                                     |
| 500    | [Error interno del servidor](https://tools.ietf.org/html/rfc7231#section-6.6.1) | Error del servidor   | Ninguna                                     |

## Pistas populares

<a id="opIdTrending Tracks"></a>

> Muestra de código

```shell
curl AUDIUS_API_HOST/v1/tracks/trending/string 


```

```http
GET AUDIUS_API_HOST/v1/tracks/trending/string HTTP/1.1

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('AUDIUS_API_HOST/v1/tracks/trending/string',
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

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get 'AUDIUS_API_HOST/v1/tracks/trending/string',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('AUDIUS_API_HOST/v1/tracks/trending/string', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','AUDIUS_API_HOST/v1/tracks/trending/string', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("AUDIUS_API_HOST/v1/tracks/trending/string");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "AUDIUS_API_HOST/v1/tracks/trending/string", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /tracks/trending/{version}`

*Obtiene las 100 pistas más populares \(más popular\) en Audius*

<h3 id="trending-tracks-parameters">Parámetros de consulta</h3>

| Nombre    | Tipo   | Requerido | Descripción                                                                  |
| --------- | ------ | --------- | ---------------------------------------------------------------------------- |
| género    | cadena | falso     | Pistas populares para un género especificado                                 |
| tiempo    | cadena | falso     | Pistas populares en un rango de tiempo especificado \(semana, mes, allTime) |
| versiones | cadena | verdad    | ninguna                                                                      |

> Ejemplo de respuesta

> 200 Respuesta

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
      "play_count": 0,
      "permalink": "string"
    }
  ]
}
```

<h3 id="trending-tracks-responses">Respuestas</h3>

| Estado | Significado                                                                     | Descripción          | Esquema                                   |
| ------ | ------------------------------------------------------------------------------- | -------------------- | ----------------------------------------- |
| 200    | [Ok](https://tools.ietf.org/html/rfc7231#section-6.3.1)                         | Exitoso              | [tracks_response](#schematracks_response) |
| 400    | [Solicitud incorrecta](https://tools.ietf.org/html/rfc7231#section-6.5.1)       | Solicitud incorrecta | Ninguna                                   |
| 500    | [Error interno del servidor](https://tools.ietf.org/html/rfc7231#section-6.6.1) | Error del servidor   | Ninguna                                   |

## Obtener pista

<a id="opIdGet Track"></a>

> Muestra de código

```shell
curl AUDIUS_API_HOST/v1/tracks/D7KyD 


```

```http
GET AUDIUS_API_HOST/v1/tracks/D7KyD HTTP/1.1

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('AUDIUS_API_HOST/v1/tracks/D7KyD',
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

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get 'AUDIUS_API_HOST/v1/tracks/D7KyD',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('AUDIUS_API_HOST/v1/tracks/D7KyD', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','AUDIUS_API_HOST/v1/tracks/D7KyD', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("AUDIUS_API_HOST/v1/tracks/D7KyD");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "AUDIUS_API_HOST/v1/tracks/D7KyD", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /tracks/{track_id}`

*Fetch a track*

<h3 id="get-track-parameters">Parámetros de consulta</h3>

| Nombre   | Tipo   | Requerido | Descripción    |
| -------- | ------ | --------- | -------------- |
| track_id | cadena | verdad    | Un ID de pista |

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

<h3 id="get-track-responses">Respuestas</h3>

| Estado | Significado                                                                     | Descripción          | Esquema                                 |
| ------ | ------------------------------------------------------------------------------- | -------------------- | --------------------------------------- |
| 200    | [Ok](https://tools.ietf.org/html/rfc7231#section-6.3.1)                         | ninguna              | [track_response](#schematrack_response) |
| 400    | [Solicitud incorrecta](https://tools.ietf.org/html/rfc7231#section-6.5.1)       | Solicitud incorrecta | Ninguna                                 |
| 500    | [Error interno del servidor](https://tools.ietf.org/html/rfc7231#section-6.6.1) | Error del servidor   | Ninguna                                 |

## Pista de streaming

<a id="opIdStream Track"></a>

> Muestra de código

```shell
curl AUDIUS_API_HOST/v1/tracks/D7KyD/stream

```

```http
GET AUDIUS_API_HOST/v1/tracks/D7KyD/stream HTTP/1.1

```

```javascript

fetch('AUDIUS_API_HOST/v1/tracks/D7KyD/stream',
{
  method: 'GET'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

result = RestClient.get 'AUDIUS_API_HOST/v1/tracks/D7KyD/stream',
  params: {
  }

p JSON.parse(result)

```

```python
import requests

r = requests.get('AUDIUS_API_HOST/v1/tracks/D7KyD/stream')

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','AUDIUS_API_HOST/v1/tracks/D7KyD/stream', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("AUDIUS_API_HOST/v1/tracks/D7KyD/stream");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "AUDIUS_API_HOST/v1/tracks/D7KyD/stream", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /tracks/{track_id}/stream`

*Obtener el archivo mp3 streamable de la pista*

Este extremo acepta la cabecera de Rango para streaming. https://developer.mozilla.org/en-US/docs/Web/HTTP/Range_requests

<h3 id="stream-track-parameters">Parámetros de consulta</h3>

| Nombre   | Tipo   | Requerido | Descripción    |
| -------- | ------ | --------- | -------------- |
| track_id | cadena | verdad    | Un ID de pista |

<h3 id="stream-track-responses">Respuestas</h3>

| Estado | Significado                                                                     | Descripción                  | Esquema |
| ------ | ------------------------------------------------------------------------------- | ---------------------------- | ------- |
| 200    | [Ok](https://tools.ietf.org/html/rfc7231#section-6.3.1)                         | Exitoso                      | Ninguna |
| 216    | Desconocido                                                                     | Contenido parcial            | Ninguna |
| 400    | [Solicitud incorrecta](https://tools.ietf.org/html/rfc7231#section-6.5.1)       | Solicitud incorrecta         | Ninguna |
| 416    | [Rango no satisfactorio](https://tools.ietf.org/html/rfc7233#section-4.4)       | Rango de contenido no válido | Ninguna |
| 500    | [Error interno del servidor](https://tools.ietf.org/html/rfc7231#section-6.6.1) | Error del servidor           | Ninguna |

<h1 id="api-challenges">desafíos</h1>

## get_get_undisbursed_challenges

<a id="opIdget_get_undisbursed_challenges"></a>

> Muestra de código

```shell
curl AUDIUS_API_HOST/v1/challenges/undisburted 


```

```http
GET AUDIUS_API_HOST/v1/challenges/undisbursed HTTP/1.1

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('AUDIUS_API_HOST/v1/challenges/undisbursed',
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

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get 'AUDIUS_API_HOST/v1/challenges/undisbursed',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('AUDIUS_API_HOST/v1/challenges/undisbursed', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','AUDIUS_API_HOST/v1/challenges/undisbursed', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("AUDIUS_API_HOST/v1/challenges/undisbursed");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "AUDIUS_API_HOST/v1/challenges/undisbursed", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /challenges/undisbursed`

<h3 id="get_get_undisbursed_challenges-parameters">Parámetros de consulta</h3>

| Nombre                       | Tipo   | Requerido | Descripción                                                                    |
| ---------------------------- | ------ | --------- | ------------------------------------------------------------------------------ |
| límite                       | cadena | falso     | El número máximo de retos de respuesta                                         |
| offset                       | cadena | falso     | El número de desafíos a omitir inicialmente en la consulta                     |
| número de bloqueo completado | cadena | falso     | Iniciando blocknumber para recuperar los desafíos no desembolsados completados |

> Ejemplo de respuesta

> 200 Respuesta

```json
{
  "data": [
    {
      "challenge_id": "string",
      "user_id": "string",
      "specifier": "string",
      "amount": "string",
      "completed_blocknumber": 0
    }
  ]
}
```

<h3 id="get_get_undisbursed_challenges-responses">Respuestas</h3>

| Estado | Significado                                                                     | Descripción          | Esquema                                                |
| ------ | ------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------ |
| 200    | [Ok](https://tools.ietf.org/html/rfc7231#section-6.3.1)                         | Exitoso              | [desafíos_sin deshacer](#schemaundisbursed_challenges) |
| 400    | [Solicitud incorrecta](https://tools.ietf.org/html/rfc7231#section-6.5.1)       | Solicitud incorrecta | Ninguna                                                |
| 500    | [Error interno del servidor](https://tools.ietf.org/html/rfc7231#section-6.6.1) | Error del servidor   | Ninguna                                                |

## get_attest

<a id="opIdget_attest"></a>

> Muestra de código

```shell
curl AUDIUS_API_HOST/v1/challenges/string/attest?user_id=string&oracle=string&specifier=string 


```

```http
GET AUDIUS_API_HOST/v1/challenges/string/attest?user_id=string&oracle=string&specifier=string HTTP/1.1

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('AUDIUS_API_HOST/v1/challenges/string/attest?user_id=string&oracle=string&specifier=string',
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

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get 'AUDIUS_API_HOST/v1/challenges/string/attest',
  params: {
  'user_id' => 'string',
'oracle' => 'string',
'specifier' => 'string'
}, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('AUDIUS_API_HOST/v1/challenges/string/attest', params={
  'user_id': 'string',  'oracle': 'string',  'specifier': 'string'
}, headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','AUDIUS_API_HOST/v1/challenges/string/attest', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("AUDIUS_API_HOST/v1/challenges/string/attest?user_id=string&oracle=string&specifier=string");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "AUDIUS_API_HOST/v1/challenges/string/attest", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /challenges/{challenge_id}/attest`

<h3 id="get_attest-parameters">Parámetros de consulta</h3>

| Nombre        | Tipo   | Requerido | Descripción |
| ------------- | ------ | --------- | ----------- |
| usuario_id    | cadena | verdad    | ninguna     |
| oráculo       | cadena | verdad    | ninguna     |
| especificador | cadena | verdad    | ninguna     |
| challenge_id  | cadena | verdad    | ninguna     |

> Ejemplo de respuesta

> 200 Respuesta

```json
{
  "data": {
    "owner_wallet": "string",
    "attestation": "string"
  }
}
```

<h3 id="get_attest-responses">Respuestas</h3>

| Estado | Significado                                             | Descripción | Esquema                                                 |
| ------ | ------------------------------------------------------- | ----------- | ------------------------------------------------------- |
| 200    | [Ok](https://tools.ietf.org/html/rfc7231#section-6.3.1) | Exitoso     | [respuesta de verificación](#schemaattestation_reponse) |

<h1 id="api-metrics">métricas</h1>

## get_trailing_app_name_metrics

<a id="opIdget_trailing_app_name_metrics"></a>

> Muestra de código

```shell
curl AUDIUS_API_HOST/v1/metrics/app_name/trailing/string 


```

```http
GET AUDIUS_API_HOST/v1/metrics/app_name/trailing/string HTTP/1.1

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('AUDIUS_API_HOST/v1/metrics/app_name/trailing/string',
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

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get 'AUDIUS_API_HOST/v1/metrics/app_name/trailing/string',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('AUDIUS_API_HOST/v1/metrics/app_name/trailing/string', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','AUDIUS_API_HOST/v1/metrics/app_name/trailing/string', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("AUDIUS_API_HOST/v1/metrics/app_name/trailing/string");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "AUDIUS_API_HOST/v1/metrics/app_name/trailing/string", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /metrics/app_name/trailing/{time_range}`

*Obtiene métricas del nombre de la aplicación final desde matview*

<h3 id="get_trailing_app_name_metrics-parameters">Parámetros de consulta</h3>

| Nombre              | Tipo   | Requerido | Descripción |
| ------------------- | ------ | --------- | ----------- |
| intervalo de tiempo | cadena | verdad    | ninguna     |

> Ejemplo de respuesta

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

<h3 id="get_trailing_app_name_metrics-responses">Respuestas</h3>

| Estado | Significado                                             | Descripción | Esquema                                                              |
| ------ | ------------------------------------------------------- | ----------- | -------------------------------------------------------------------- |
| 200    | [Ok](https://tools.ietf.org/html/rfc7231#section-6.3.1) | Exitoso     | [app_nombre_respuesta_trailing](#schemaapp_name_trailing_response) |

<h1 id="api-resolve">resolver</h1>

## Resolver

<a id="opIdResolve"></a>

> Muestra de código

```shell
curl AUDIUS_API_HOST/v1/resolve?url=https://audius.co/camouflybeats/hypermantra-86216 


```

```http
GET AUDIUS_API_HOST/v1/resolve?url=https://audius.co/camouflybeats/hypermantra-86216 HTTP/1.1

```

```javascript

const headers = {
  'Accept':'text/plain'
};

fetch('AUDIUS_API_HOST/v1/resolve?url=https://audius.co/camouflybeats/hypermantra-86216',
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

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'text/plain'
}

result = RestClient.get 'AUDIUS_API_HOST/v1/resolve',
  params: {
  'url' => 'string'
}, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'text/plain'
}

r = requests.get('AUDIUS_API_HOST/v1/resolve', params={
  'url': 'https://audius.co/camouflybeats/hypermantra-86216'
}, headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'text/plain',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','AUDIUS_API_HOST/v1/resolve', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("AUDIUS_API_HOST/v1/resolve?url=https://audius.co/camouflybeats/hypermantra-86216");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"text/plain"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "AUDIUS_API_HOST/v1/resolve", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /resolve`

*Resuelve y redirige una URL de la aplicación de Audius a la URL del recurso API que representa*

Este endpoint le permite buscar y acceder a los recursos API cuando sólo conoce la URL de audius.co. Se admiten pistas, listas de reproducción y usuarios.

<h3 id="resolve-parameters">Parámetros de consulta</h3>

| Nombre | Tipo   | Requerido | Descripción                                                                         |
| ------ | ------ | --------- | ----------------------------------------------------------------------------------- |
| url    | cadena | verdad    | URL a resolver. URL completa \(https://audius.co\) o simplemente la ruta absoluta |

> Ejemplo de respuesta

> Redirección interna

```
{"HTTP/1.1 302 Found Location":"/v1/tracks/V4W8r"}
```

<h3 id="resolve-responses">Respuestas</h3>

| Estado | Significado                                                     | Descripción         | Esquema |
| ------ | --------------------------------------------------------------- | ------------------- | ------- |
| 302    | [Encontrado](https://tools.ietf.org/html/rfc7231#section-6.4.3) | Redirección interna | Ninguna |

<h3 id="resolve-responseschema">Esquema de respuesta</h3>

# Esquemas

Los siguientes son ejemplos de formatos de respuesta que se pueden esperar recibir de la API.

<a id="schemauser_response"></a>
<a id="schema_user_response"></a>
<a id="tocSuser_response"></a>
<a id="tocsuser_response"></a>
<h2 id="tocS_user_response">usuario_respuesta</h2>

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

### Propiedades

| Nombre | Tipo                    | Requerido | Restricciones | Descripción |
| ------ | ----------------------- | --------- | ------------- | ----------- |
| datos  | [usuarios](#schemauser) | falso     | ninguna       | ninguna     |

<a id="schemauser"></a>
<a id="schema_user"></a>
<a id="tocSuser"></a>
<a id="tocsuser"></a>
<h2 id="tocS_user">usuario</h2>

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

### Propiedades

| Nombre                  | Tipo                                    | Requerido | Restricciones | Descripción |
| ----------------------- | --------------------------------------- | --------- | ------------- | ----------- |
| contador de álbumes     | entero                                  | verdad    | ninguna       | ninguna     |
| biografía               | cadena                                  | falso     | ninguna       | ninguna     |
| foto de portada         | [foto de portada](#schemacover_photo)   | falso     | ninguna       | ninguna     |
| contador_followeeks     | entero                                  | verdad    | ninguna       | ninguna     |
| cuenta_seguidor         | entero                                  | verdad    | ninguna       | ninguna     |
| manejo                  | cadena                                  | verdad    | ninguna       | ninguna     |
| id                      | cadena                                  | verdad    | ninguna       | ninguna     |
| es verificado           | boolean                                 | verdad    | ninguna       | ninguna     |
| ubicación               | cadena                                  | falso     | ninguna       | ninguna     |
| nombre                  | cadena                                  | verdad    | ninguna       | ninguna     |
| contador de listas      | entero                                  | verdad    | ninguna       | ninguna     |
| imagen_perfil           | [imagen_perfil](#schemaprofile_picture) | falso     | ninguna       | ninguna     |
| contador_repost_count | entero                                  | verdad    | ninguna       | ninguna     |
| track_count             | entero                                  | verdad    | ninguna       | ninguna     |

<a id="schemacover_photo"></a>
<a id="schema_cover_photo"></a>
<a id="tocScover_photo"></a>
<a id="tocscover_photo"></a>
<h2 id="tocS_cover_photo">foto de portada</h2>

```json
{
  "640x": "string",
  "2000x": "string"
}

```

### Propiedades

| Nombre | Tipo   | Requerido | Restricciones | Descripción |
| ------ | ------ | --------- | ------------- | ----------- |
| 640x   | cadena | falso     | ninguna       | ninguna     |
| 2000x  | cadena | falso     | ninguna       | ninguna     |

<a id="schemaprofile_picture"></a>
<a id="schema_profile_picture"></a>
<a id="tocSprofile_picture"></a>
<a id="tocsprofile_picture"></a>
<h2 id="tocS_profile_picture">imagen_perfil</h2>

```json
{
  "150x150": "string",
  "480x480": "string",
  "1000x1000": "string"
}

```

### Propiedades

| Nombre    | Tipo   | Requerido | Restricciones | Descripción |
| --------- | ------ | --------- | ------------- | ----------- |
| 150 x 150 | cadena | falso     | ninguna       | ninguna     |
| 480 x 480 | cadena | falso     | ninguna       | ninguna     |
| 1000x1000 | cadena | falso     | ninguna       | ninguna     |

<a id="schematracks_response"></a>
<a id="schema_tracks_response"></a>
<a id="tocStracks_response"></a>
<a id="tocstracks_response"></a>
<h2 id="tocS_tracks_response">tracks_response</h2>

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
      "play_count": 0,
      "permalink": "string"
    }
  ]
}

```

### Propiedades

| Nombre | Tipo                    | Requerido | Restricciones | Descripción |
| ------ | ----------------------- | --------- | ------------- | ----------- |
| datos  | [[Pista](#schematrack)] | falso     | ninguna       | ninguna     |

<a id="schematrack"></a>
<a id="schema_Track"></a>
<a id="tocStrack"></a>
<a id="tocstrack"></a>
<h2 id="tocS_Track">Pista</h2>

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
  "play_count": 0,
  "permalink": "string"
}

```

### Propiedades

| Nombre                  | Estilo                                | Requerido | Restricciones | Descripción |
| ----------------------- | ------------------------------------- | --------- | ------------- | ----------- |
| obra de arte            | [track_artwork](#schematrack_artwork) | falso     | ninguna       | ninguna     |
| descripción             | cadena                                | falso     | ninguna       | ninguna     |
| género                  | cadena                                | falso     | ninguna       | ninguna     |
| id                      | cadena                                | verdad    | ninguna       | ninguna     |
| humor                   | cadena                                | falso     | ninguna       | ninguna     |
| fecha de lanzamiento    | cadena                                | falso     | ninguna       | ninguna     |
| remix_de                | [remix_parent](#schemaremix_parent)   | falso     | ninguna       | ninguna     |
| contador_repost_count | entero                                | verdad    | ninguna       | ninguna     |
| contador_favoritos      | entero                                | verdad    | ninguna       | ninguna     |
| etiquetas               | cadena                                | falso     | ninguna       | ninguna     |
| título                  | cadena                                | verdad    | ninguna       | ninguna     |
| usuario                 | [usuario](#schemauser)                | verdad    | ninguna       | ninguna     |
| duración                | entero                                | verdad    | ninguna       | ninguna     |
| descargable             | boolean                               | falso     | ninguna       | ninguna     |
| contar_jugar            | entero                                | verdad    | ninguna       | ninguna     |
| permalink               | cadena                                | falso     | ninguna       | ninguna     |

<a id="schematrack_artwork"></a>
<a id="schema_track_artwork"></a>
<a id="tocStrack_artwork"></a>
<a id="tocstrack_artwork"></a>
<h2 id="tocS_track_artwork">track_artwork</h2>

```json
{
  "150x150": "string",
  "480x480": "string",
  "1000x1000": "string"
}

```

### Propiedades

| Nombre    | Tipo   | Requerido | Restricciones | Descripción |
| --------- | ------ | --------- | ------------- | ----------- |
| 150 x 150 | cadena | falso     | ninguna       | ninguna     |
| 480 x 480 | cadena | falso     | ninguna       | ninguna     |
| 1000x1000 | cadena | falso     | ninguna       | ninguna     |

<a id="schemaremix_parent"></a>
<a id="schema_remix_parent"></a>
<a id="tocSremix_parent"></a>
<a id="tocsremix_parent"></a>
<h2 id="tocS_remix_parent">remix_parent</h2>

```json
{
  "tracks": [
    {
      "parent_track_id": "string"
    }
  ]
}

```

### Propiedades

| Nombre | Tipo                                    | Requerido | Restricciones | Descripción |
| ------ | --------------------------------------- | --------- | ------------- | ----------- |
| pistas | [[track_element](#schematrack_element)] | falso     | ninguna       | ninguna     |

<a id="schematrack_element"></a>
<a id="schema_track_element"></a>
<a id="tocStrack_element"></a>
<a id="tocstrack_element"></a>
<h2 id="tocS_track_element">track_element</h2>

```json
{
  "parent_track_id": "string"
}

```

### Propiedades

| Nombre            | Tipo   | Requerido | Restricciones | Descripción |
| ----------------- | ------ | --------- | ------------- | ----------- |
| parent_track_id | cadena | verdad    | ninguna       | ninguna     |

<a id="schemareposts"></a>
<a id="schema_reposts"></a>
<a id="tocSreposts"></a>
<a id="tocsreposts"></a>
<h2 id="tocS_reposts">reposts</h2>

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

### Propiedades

| Nombre | Tipo                           | Requerido | Restricciones | Descripción |
| ------ | ------------------------------ | --------- | ------------- | ----------- |
| datos  | [[actividad](#schemaactivity)] | falso     | ninguna       | ninguna     |

<a id="schemaactivity"></a>
<a id="schema_activity"></a>
<a id="tocSactivity"></a>
<a id="tocsactivity"></a>
<h2 id="tocS_activity">actividad</h2>

```json
{
  "timestamp": "string",
  "item_type": {},
  "item": {}
}

```

### Propiedades

| Nombre          | Tipo   | Requerido | Restricciones | Descripción |
| --------------- | ------ | --------- | ------------- | ----------- |
| marca de tiempo | cadena | falso     | ninguna       | ninguna     |
| tipo_objeto     | objeto | falso     | ninguna       | ninguna     |
| objeto          | objeto | falso     | ninguna       | ninguna     |

<a id="schemafavorites_response"></a>
<a id="schema_favorites_response"></a>
<a id="tocSfavorites_response"></a>
<a id="tocsfavorites_response"></a>
<h2 id="tocS_favorites_response">favoritos_respuesta</h2>

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

### Propiedades

| Nombre | Tipo                          | Requerido | Restricciones | Descripción |
| ------ | ----------------------------- | --------- | ------------- | ----------- |
| datos  | [[favorito](#schemafavorite)] | falso     | ninguna       | ninguna     |

<a id="schemafavorite"></a>
<a id="schema_favorite"></a>
<a id="tocSfavorite"></a>
<a id="tocsfavorite"></a>
<h2 id="tocS_favorite">favorito</h2>

```json
{
  "favorite_item_id": "string",
  "favorite_type": "string",
  "user_id": "string"
}

```

### Propiedades

| Nombre                   | Tipo   | Requerido | Restricciones | Descripción |
| ------------------------ | ------ | --------- | ------------- | ----------- |
| id del elemento favorito | cadena | verdad    | ninguna       | ninguna     |
| favorito_tipo            | cadena | verdad    | ninguna       | ninguna     |
| usuario_id               | cadena | verdad    | ninguna       | ninguna     |

<a id="schematags_response"></a>
<a id="schema_tags_response"></a>
<a id="tocStags_response"></a>
<a id="tocstags_response"></a>
<h2 id="tocS_tags_response">etiquetas_respuesta</h2>

```json
{
  "data": [
    "string"
  ]
}

```

### Propiedades

| Nombre | Tipo     | Requerido | Restricciones | Descripción |
| ------ | -------- | --------- | ------------- | ----------- |
| datos  | [string] | falso     | ninguna       | ninguna     |

<a id="schemauser_search"></a>
<a id="schema_user_search"></a>
<a id="tocSuser_search"></a>
<a id="tocsuser_search"></a>
<h2 id="tocS_user_search">usuario_búsqueda</h2>

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

```

### Propiedades

| Nombre | Tipo                     | Requerido | Restricciones | Descripción |
| ------ | ------------------------ | --------- | ------------- | ----------- |
| datos  | [[usuario](#schemauser)] | falso     | ninguna       | ninguna     |

<a id="schemaassociated_wallets_response"></a>
<a id="schema_associated_wallets_response"></a>
<a id="tocSassociated_wallets_response"></a>
<a id="tocsassociated_wallets_response"></a>
<h2 id="tocS_associated_wallets_response">associated_wallets_response</h2>

```json
{
  "data": {
    "wallets": [
      "string"
    ],
    "sol_wallets": [
      "string"
    ]
  }
}

```

### Propiedades

| Nombre | Tipo                                           | Requerido | Restricciones | Descripción |
| ------ | ---------------------------------------------- | --------- | ------------- | ----------- |
| datos  | [monedero_asociado](#schemaassociated_wallets) | falso     | ninguna       | ninguna     |

<a id="schemaassociated_wallets"></a>
<a id="schema_associated_wallets"></a>
<a id="tocSassociated_wallets"></a>
<a id="tocsassociated_wallets"></a>
<h2 id="tocS_associated_wallets">monedero_asociado</h2>

```json
{
  "wallets": [
    "string"
  ],
  "sol_wallets": [
    "string"
  ]
}

```

### Propiedades

| Nombre        | Tipo     | Requerido | Restricciones | Descripción |
| ------------- | -------- | --------- | ------------- | ----------- |
| billeteras    | [string] | verdad    | ninguna       | ninguna     |
| monederos sol | [string] | verdad    | ninguna       | ninguna     |

<a id="schemauser_associated_wallet_response"></a>
<a id="schema_user_associated_wallet_response"></a>
<a id="tocSuser_associated_wallet_response"></a>
<a id="tocsuser_associated_wallet_response"></a>
<h2 id="tocS_user_associated_wallet_response">respuesta_monedero_asociado</h2>

```json
{
  "data": {
    "user_id": "string"
  }
}

```

### Propiedades

| Nombre | Tipo                                               | Requerido | Restricciones | Descripción |
| ------ | -------------------------------------------------- | --------- | ------------- | ----------- |
| datos  | [id de usuario codificado](#schemaencoded_user_id) | falso     | ninguna       | ninguna     |

<a id="schemaencoded_user_id"></a>
<a id="schema_encoded_user_id"></a>
<a id="tocSencoded_user_id"></a>
<a id="tocsencoded_user_id"></a>
<h2 id="tocS_encoded_user_id">id de usuario codificado</h2>

```json
{
  "user_id": "string"
}

```

### Propiedades

| Nombre     | Tipo   | Requerido | Restricciones | Descripción |
| ---------- | ------ | --------- | ------------- | ----------- |
| usuario_id | cadena | falso     | ninguna       | ninguna     |

<a id="schemaget_challenges"></a>
<a id="schema_get_challenges"></a>
<a id="tocSget_challenges"></a>
<a id="tocsget_challenges"></a>
<h2 id="tocS_get_challenges">get_challenges</h2>

```json
{
  "data": [
    {
      "challenge_id": "string",
      "user_id": "string",
      "specifier": "string",
      "is_complete": true,
      "is_active": true,
      "is_disbursed": true,
      "current_step_count": 0,
      "max_steps": 0,
      "challenge_type": "string",
      "metadata": {}
    }
  ]
}

```

### Propiedades

| Nombre | Tipo                                              | Requerido | Restricciones | Descripción |
| ------ | ------------------------------------------------- | --------- | ------------- | ----------- |
| datos  | [[challenge_response](#schemachallenge_response)] | falso     | ninguna       | ninguna     |

<a id="schemachallenge_response"></a>
<a id="schema_challenge_response"></a>
<a id="tocSchallenge_response"></a>
<a id="tocschallenge_response"></a>
<h2 id="tocS_challenge_response">challenge_response</h2>

```json
{
  "challenge_id": "string",
  "user_id": "string",
  "specifier": "string",
  "is_complete": true,
  "is_active": true,
  "is_disbursed": true,
  "current_step_count": 0,
  "max_steps": 0,
  "challenge_type": "string",
  "metadata": {}
}

```

### Propiedades

| Nombre                 | Tipo    | Requerido | Restricciones | Descripción |
| ---------------------- | ------- | --------- | ------------- | ----------- |
| challenge_id           | cadena  | verdad    | ninguna       | ninguna     |
| usuario_id             | cadena  | verdad    | ninguna       | ninguna     |
| especificador          | cadena  | falso     | ninguna       | ninguna     |
| está_completado        | boolean | verdad    | ninguna       | ninguna     |
| está_activo            | boolean | verdad    | ninguna       | ninguna     |
| es_desembolsado        | boolean | verdad    | ninguna       | ninguna     |
| contador_paso_actual | entero  | falso     | ninguna       | ninguna     |
| max_pasos              | entero  | falso     | ninguna       | ninguna     |
| reto_tipo              | cadena  | verdad    | ninguna       | ninguna     |
| metadatos              | objeto  | verdad    | ninguna       | ninguna     |

<a id="schemaplaylist_response"></a>
<a id="schema_playlist_response"></a>
<a id="tocSplaylist_response"></a>
<a id="tocsplaylist_response"></a>
<h2 id="tocS_playlist_response">playlist_respuesta</h2>

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

### Propiedades

| Nombre | Tipo                                       | Requerido | Restricciones | Descripción |
| ------ | ------------------------------------------ | --------- | ------------- | ----------- |
| datos  | [[lista de reproducción](#schemaplaylist)] | falso     | ninguna       | ninguna     |

<a id="schemaplaylist"></a>
<a id="schema_playlist"></a>
<a id="tocSplaylist"></a>
<a id="tocsplaylist"></a>
<h2 id="tocS_playlist">lista de reproducción</h2>

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

### Propiedades

| Nombre                  | Tipo                                        | Requerido | Restricciones | Descripción |
| ----------------------- | ------------------------------------------- | --------- | ------------- | ----------- |
| obra de arte            | [playlist_artwork](#schemaplaylist_artwork) | falso     | ninguna       | ninguna     |
| descripción             | cadena                                      | falso     | ninguna       | ninguna     |
| id                      | cadena                                      | verdad    | ninguna       | ninguna     |
| es_álbum                | boolean                                     | verdad    | ninguna       | ninguna     |
| playlist_name           | cadena                                      | verdad    | ninguna       | ninguna     |
| contador_repost_count | entero                                      | verdad    | ninguna       | ninguna     |
| contador_favoritos      | entero                                      | verdad    | ninguna       | ninguna     |
| contador_total_jugar  | entero                                      | verdad    | ninguna       | ninguna     |
| usuario                 | [usuario](#schemauser)                      | verdad    | ninguna       | ninguna     |

<a id="schemaplaylist_artwork"></a>
<a id="schema_playlist_artwork"></a>
<a id="tocSplaylist_artwork"></a>
<a id="tocsplaylist_artwork"></a>
<h2 id="tocS_playlist_artwork">playlist_artwork</h2>

```json
{
  "150x150": "string",
  "480x480": "string",
  "1000x1000": "string"
}

```

### Propiedades

| Nombre    | Tipo   | Requerido | Restricciones | Descripción |
| --------- | ------ | --------- | ------------- | ----------- |
| 150 x 150 | cadena | falso     | ninguna       | ninguna     |
| 480 x 480 | cadena | falso     | ninguna       | ninguna     |
| 1000x1000 | cadena | falso     | ninguna       | ninguna     |

<a id="schemaplaylist_tracks_response"></a>
<a id="schema_playlist_tracks_response"></a>
<a id="tocSplaylist_tracks_response"></a>
<a id="tocsplaylist_tracks_response"></a>
<h2 id="tocS_playlist_tracks_response">playlist_pistas_respuesta_</h2>

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
      "play_count": 0,
      "permalink": "string"
    }
  ]
}

```

### Propiedades

| Nombre | Tipo                    | Requerido | Restricciones | Descripción |
| ------ | ----------------------- | --------- | ------------- | ----------- |
| datos  | [[Pista](#schematrack)] | falso     | ninguna       | ninguna     |

<a id="schemaplaylist_search_result"></a>
<a id="schema_playlist_search_result"></a>
<a id="tocSplaylist_search_result"></a>
<a id="tocsplaylist_search_result"></a>
<h2 id="tocS_playlist_search_result">playlist_resultado_búsqueda</h2>

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

### Propiedades

| Nombre | Tipo                                       | Requerido | Restricciones | Descripción |
| ------ | ------------------------------------------ | --------- | ------------- | ----------- |
| datos  | [[lista de reproducción](#schemaplaylist)] | falso     | ninguna       | ninguna     |

<a id="schematrending_playlists_response"></a>
<a id="schema_trending_playlists_response"></a>
<a id="tocStrending_playlists_response"></a>
<a id="tocstrending_playlists_response"></a>
<h2 id="tocS_trending_playlists_response">respuesta de las listas de reproducción</h2>

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

### Propiedades

| Nombre | Tipo                                       | Requerido | Restricciones | Descripción |
| ------ | ------------------------------------------ | --------- | ------------- | ----------- |
| datos  | [[lista de reproducción](#schemaplaylist)] | falso     | ninguna       | ninguna     |

<a id="schematrack_response"></a>
<a id="schema_track_response"></a>
<a id="tocStrack_response"></a>
<a id="tocstrack_response"></a>
<h2 id="tocS_track_response">track_response</h2>

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
    "play_count": 0,
    "permalink": "string"
  }
}

```

### Propiedades

| Nombre | Tipo                  | Requerido | Restricciones | Descripción |
| ------ | --------------------- | --------- | ------------- | ----------- |
| datos  | [Pista](#schematrack) | falso     | ninguna       | ninguna     |

<a id="schematrack_search"></a>
<a id="schema_track_search"></a>
<a id="tocStrack_search"></a>
<a id="tocstrack_search"></a>
<h2 id="tocS_track_search">búsqueda_seguimiento</h2>

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
      "play_count": 0,
      "permalink": "string"
    }
  ]
}

```

### Propiedades

| Nombre | Tipo                    | Requerido | Restricciones | Descripción |
| ------ | ----------------------- | --------- | ------------- | ----------- |
| datos  | [[Pista](#schematrack)] | falso     | ninguna       | ninguna     |

<a id="schemaattestation_reponse"></a>
<a id="schema_attestation_reponse"></a>
<a id="tocSattestation_reponse"></a>
<a id="tocsattestation_reponse"></a>
<h2 id="tocS_attestation_reponse">respuesta de verificación</h2>

```json
{
  "data": {
    "owner_wallet": "string",
    "attestation": "string"
  }
}

```

### Propiedades

| Nombre | Tipo                              | Requerido | Restricciones | Descripción |
| ------ | --------------------------------- | --------- | ------------- | ----------- |
| datos  | [certificado](#schemaattestation) | falso     | ninguna       | ninguna     |

<a id="schemaattestation"></a>
<a id="schema_attestation"></a>
<a id="tocSattestation"></a>
<a id="tocsattestation"></a>
<h2 id="tocS_attestation">certificado</h2>

```json
{
  "owner_wallet": "string",
  "attestation": "string"
}

```

### Propiedades

| Nombre              | Tipo   | Requerido | Restricciones | Descripción |
| ------------------- | ------ | --------- | ------------- | ----------- |
| propietario_cartera | cadena | verdad    | ninguna       | ninguna     |
| certificado         | cadena | verdad    | ninguna       | ninguna     |

<a id="schemaundisbursed_challenges"></a>
<a id="schema_undisbursed_challenges"></a>
<a id="tocSundisbursed_challenges"></a>
<a id="tocsundisbursed_challenges"></a>
<h2 id="tocS_undisbursed_challenges">desafíos_sin deshacer</h2>

```json
{
  "data": [
    {
      "challenge_id": "string",
      "user_id": "string",
      "specifier": "string",
      "amount": "string",
      "completed_blocknumber": 0
    }
  ]
}

```

### Propiedades

| Nombre | Tipo                                                    | Requerido | Restricciones | Descripción |
| ------ | ------------------------------------------------------- | --------- | ------------- | ----------- |
| datos  | [[undisbursed_challenge](#schemaundisbursed_challenge)] | falso     | ninguna       | ninguna     |

<a id="schemaundisbursed_challenge"></a>
<a id="schema_undisbursed_challenge"></a>
<a id="tocSundisbursed_challenge"></a>
<a id="tocsundisbursed_challenge"></a>
<h2 id="tocS_undisbursed_challenge">desafíos_sin deshacer</h2>

```json
{
  "challenge_id": "string",
  "user_id": "string",
  "specifier": "string",
  "amount": "string",
  "completed_blocknumber": 0
}

```

### Propiedades

| Nombre                       | Tipo   | Requerido | Restricciones | Descripción |
| ---------------------------- | ------ | --------- | ------------- | ----------- |
| challenge_id                 | cadena | verdad    | ninguna       | ninguna     |
| usuario_id                   | cadena | verdad    | ninguna       | ninguna     |
| especificador                | cadena | verdad    | ninguna       | ninguna     |
| monto                        | cadena | verdad    | ninguna       | ninguna     |
| número de bloqueo completado | entero | verdad    | ninguna       | ninguna     |

<a id="schemaapp_name_trailing_response"></a>
<a id="schema_app_name_trailing_response"></a>
<a id="tocSapp_name_trailing_response"></a>
<a id="tocsapp_name_trailing_response"></a>
<h2 id="tocS_app_name_trailing_response">app_nombre_respuesta_trailing</h2>

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

### Propiedades

| Nombre | Tipo                                                                   | Requerido | Restricciones | Descripción |
| ------ | ---------------------------------------------------------------------- | --------- | ------------- | ----------- |
| datos  | [[app\_name\_trailing\_metric](#schemaapp_name_trailing_metric)] | falso     | ninguna       | ninguna     |

<a id="schemaapp_name_trailing_metric"></a>
<a id="schema_app_name_trailing_metric"></a>
<a id="tocSapp_name_trailing_metric"></a>
<a id="tocsapp_name_trailing_metric"></a>
<h2 id="tocS_app_name_trailing_metric">métrica del nombre de la aplicación</h2>

```json
{
  "count": 0,
  "name": "string"
}

```

### Propiedades

| Nombre   | Tipo   | Requerido | Restricciones | Descripción |
| -------- | ------ | --------- | ------------- | ----------- |
| contador | entero | falso     | ninguna       | ninguna     |
| nombre   | cadena | falso     | ninguna       | ninguna     |

