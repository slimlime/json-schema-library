const getTypeOf = require("./getTypeOf");
const filter = require("./utils/filter");
const flattenArray = require("./utils/flattenArray");


function getJsonSchemaType(value, expectedType) {
    let jsType = getTypeOf(value);

    if (
        jsType === "number" && (expectedType === "integer" ||
        (Array.isArray(expectedType) && expectedType.includes("integer")))
    ) {
        jsType = Number.isInteger(value) ? "integer" : "number";
    }
    return jsType;
}


/**
 * Validate data by a json schema
 *
 * @param  {CoreInterface} core - validator
 * @param  {Schema} schema      - json schema
 * @param  {Mixed} value        - value to validate
 * @param  {String} [pointer]   - json pointer pointing to value (used for error-messages only)
 * @return {Array} list of errors or empty
 */
module.exports = function validate(core, schema, value, pointer = "#") {
    if (schema.type === "error") {
        return [schema];
    }

    schema = core.resolveRef(schema);

    const receivedType = getJsonSchemaType(value, schema.type);
    const expectedType = schema.type || receivedType;

    if (receivedType !== expectedType && (!Array.isArray(expectedType) || !expectedType.includes(receivedType))) {
        return [core.errors.typeError({ received: receivedType, expected: expectedType, value, pointer })];
    }

    if (core.validateType[receivedType] == null) {
        return [core.errors.invalidTypeError({ receivedType, pointer })];
    }

    const errors = flattenArray(core.validateType[receivedType](core, schema, value, pointer));
    // also promises may be passed along (validateAsync)
    return errors.filter(filter.errorOrPromise);
};
