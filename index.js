'use strict';
/*
Need to be able to handle paths with params. Maybe start with 2 types of params:
  :param - Any param, so can have any value

Need to parse the actual path and compare to the ACL path to match.

I think simple role/path is all I really need. Role can be an array of roles, something like:
[
  {
    'resource': '/users/:param'.
    'methods: ['get'],
    'roles': ['user', 'admin', 'super']
  },
  {
    'resource': '/tokens/:param'.
    'method: ['get'],
    'roles': ['user', 'admin', 'super']
  },
  {
    'resource': '/path/:param/path'.
    'method: ['get'],
    'roles': ['user', 'admin', 'super']
  }
]
 */

let resources = [], validRoles = [];
let validMethods = [
    'GET',
    'POST',
    'PATCH',
    'DELETE',
    'PUT'
];
let wildcards = ['*', ':param', ':user'];

// Adds a resource to the ACL
exports.addResource = function (resource, methods, roles) {
    methods.forEach(function(value, index, array) {
        if (validMethods.indexOf(value.toUpperCase()) === -1) {
            throw 'Invalid method: ' + value;
        }
    });

    roles.forEach(function(value, index, array) {
        if (validRoles.indexOf(value) === -1) {
            throw 'Invalid role: ' + value;
        }
    });

    resources.push({
        'resource': resource,
        'methods': methods,
        'roles': roles
    });
};

exports.setRoles = function (roles) {
    if (Array.isArray(roles)){
        validRoles = roles;
    } else {
        throw 'Value is not an array';
    }
};

exports.authorize = function (req, res, next) {
    if (req.user) {
        // Get the resource for this request
        let resource = getAclResource(req.path);

        if (resource === null) {
            res.status(403).send({
                message: 'No permissions have been setup for this resource.'
            });
        }

        // If the request method and the user's role match the resource, we're good.
        if (resource.methods.includes(req.method) && resource.roles.includes(req.user.role)) {
            next();
        } else {
            res.status(403).send({
                message: 'Insufficient permissions to access this resource.'
            });
        }
    } else {
        res.send({ message: 'User not authenticated' })
    }
};

function getAclResource(path) {

    // Split the path into parts
    let pathParts = path.split('/');

    resources.forEach(function (value, index, array) {
        let matchParts = value.resource.split('/');
        let pathMatch = true;

        // If array lengths are equal (paths are the same length), check parts, otherwise no match
        if (pathParts.length === matchParts.length) {
            // check that each part matches
            for (let i = 0; i <= matchParts.length; i++) {
                // If the path part is a wilcard, assume a match for this part (don't change state ot pathMatch)
                if (wildcards.includes(matchParts[i]) ) continue;

                // Check if parts are equal
                if (matchParts[i] === pathParts[i]) {
                    continue;
                } else {
                    pathMatch = false;
                    break;
                }
            }
        } else {
            pathMatch = false;
        }

        if (pathMatch) return value.resource;
    });

    return null;
}