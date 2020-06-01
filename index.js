'use strict';

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
exports.addResource = function (resource, permissions) {
    for (const permission of permissions) {
        if (validRoles.indexOf(permission.role) === -1) {
            throw 'Invalid role: ' + permission;
        }

        if (Array.isArray(permission.methods)) {
            for (const method of permission.methods) {
                if (validMethods.indexOf(method.toUpperCase()) === -1) {
                    throw 'Invalid method: ' + method;
                }
            }
        } else {
            throw 'ACL methods is not an array';
        }

        resources.push({
            'resource': resource,
            'permissions': permissions
        });
    }

    console.log(JSON.stringify(resources));
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

        let found;

        for (const permission of resource.permissions) {
            if (permission.role === req.user.role) {
                found = permission;
                break;
            }
        }

        if (found === null) {
            res.status(403).send({
                message: 'Permissions for this resource do not exist for your role.'
            });
        }

        if (found.methods.includes(req.method) && found.role.includes(req.user.role)) {
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

    for (const value of resources) {
        let matchParts = value.resource.split('/');
        let pathMatch = true;

        // If array lengths are equal (paths are the same length), check parts, otherwise no match
        if (pathParts.length === matchParts.length) {
            // check that each part matches
            for (let i = 0; i < matchParts.length; i++) {
                if (matchParts[i] === '') continue;
                // If the path part is a wildcard, assume a match for this part (don't change state ot pathMatch)
                if (wildcards.includes(matchParts[i]) ) continue;

                // Check if parts not equal
                if (matchParts[i] !== pathParts[i]) {
                    pathMatch = false;
                    break;
                }
            }
        } else {
            pathMatch = false;
        }

        if (pathMatch) return value;
    }

    return null;
}