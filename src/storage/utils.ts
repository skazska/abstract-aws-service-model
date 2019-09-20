/**
 * sets properties from options to params capitalizing their names
 * @param params - params to add to
 * @param options - options to be added to params
 */
export const attachParams = (params :object, options :any) :any => {
    Object.keys(options||{}).forEach(key => {
        params[key.charAt(0).toUpperCase() + key.slice(1)] = options[key];
    });
    return params;
};
