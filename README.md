# node_express_acl

Node Express ACL is a light-weight pure JS implementation of an Access Control List currently with no dependencies on
other Node module. It's simple design allows you to start using ACL with your ExpressJS/NodeJS back-end very quickly.
This module functions particularly well for RESTful APIs.

[![NPM](https://nodei.co/npm/node_express_acl.png)](https://nodei.co/npm/node_express_acl/)

## Installation

This module does require that your have [NodeJS](http://nodejs.org/) and [ExpressJS](http://expressjs.com/) installed.
```sh
npm install node_express_acl
```

## User Session Requirement

This module does depend on authenticated users and that you are storing your authenticated user object in the request
object. This is a pretty specific requirement, but something that can be more flexible in future releases. In your
authentication middleware, but sure you store your user object in the request object, like so:

```javascript
req.user = authenticatedUserObject;
```

The only property that this module uses in the user object is ``role``. At minimum your user object should contain:

```json
{
  "role": "user"
}
```

Of course you'll have more properties in there, but that's the only required property.

## Usage

The first step is to initialize the roles that you're using for your application. You can make this call pretty much
anywhere in your application, but the best places would be in your main JS file (``index.js`` or ``server.js`` for
example), where you perform application config or initialization (``config.js`` or ``init.js`` for example) or in your
``express.js`` file.

The roles is just an array of the roles you are using. Later, when adding resources, the roles you reference will be
validated against these roles. Set the roles like so:

```javascript
// Import the module at the beginning of your file
const acl = require('node_express_acl');


// Later in the file (could be right after the import), set the roles
acl.setRoles(['user', 'admin', 'super']);
```

### Adding Resources

For every route that you want to checked for authorization, you'll create one resource. You can add all of your ACL
resources in one file, even in the same file where you set the roles (as described above). I separate my routes into
separate files grouped by functionality (for example, all /auth endpoints are in one files and all /user endpoints are
in one file). To keep the ACL resources in context of the routes, I prefer to add resources for related endpoints in the
same file. I do this so I can see what role has access to which endpoints in the same file that defines the endpoints.
This is up to you though.

Resources start by defining what endpoint you'd like authenticated. Then specify the roles and the HTTP methods allowed
for those roles. Here's how you add resources:

```javascript
try {
    acl.addResource('/users',[
        {'role': 'super', 'methods': ['GET', 'POST']}
    ]);
    acl.addResource('/users/:param',[
        {'role': 'super', 'methods': ['GET', 'PATCH', 'DELETE']},
        {'role': 'admin', 'methods': ['GET', 'PATCH']},
        {'role': 'user', 'methods': ['GET', 'PATCH']}
    ]);
} catch (err) {
    console.log('Error adding ACL resource: ' + err);
}
```

First, the ``addResource`` function validates the roles (as set by ``setRoles``) and the HTTP methods (must be one of:
``GET``, ``POST``, ``PUT``, ``PATCH``, ``DELETE``). This is why you need to put these calls in a try/catch block. If the
validation fails, it just means that the endpoint authentication will always fail.

The ``addResource`` function expects 2 parameters:

* endpoint (string): The endpoint you would like to add authorization to.
* permissions (string|JSON): The role based permissions for the enpoint.

An endpoint can authorize multiple roles, and each role can have permission to use the configured HTTP methods. The code
above demonstrates the format of the JSON permissions parameter.

### Using ACL in Routes

The last step is to add in the ACL authorization to the routes that you'd like to use your configured ACL resources.
Like so:

```javascript
    app.route('/users')
        .get(acl.authorize, controller.getAll)
        .post(acl.authorize, controller.insert);
    app.route('/users/:userId')
        .get(acl.authorize, controller.getOne)
        .patch(acl.authorize, controller.patch)
        .delete(acl.authorize, controller.remove);
```

Be sure to import the ``node_express_acl`` module in your route file. Then add in the ACL authorization call as the first
parameter to your routes (the way PassportJS does it).

That pretty much does the trick. This is currently used in the
[node-restful-api-skeleton](https://github.com/widgetapps/node-restful-api-skeleton) project, so please take a look at
the code in that project to see this module in action.
