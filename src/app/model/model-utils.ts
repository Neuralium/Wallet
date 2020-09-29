
function assignObjectProperties_(sourceObject:object, destinationObject:object)
{
    Object.getOwnPropertyNames(sourceObject).forEach(name => 
    {
        destinationObject[name] = sourceObject[name];
    });
}

export {assignObjectProperties_ as assignObjectProperties}