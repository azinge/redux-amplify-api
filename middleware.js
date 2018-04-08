import { Auth, API } from 'aws-amplify';

const makeAPICall = ({
  service,
  method: rawMethod,
  path: rawPath,
  params: rawParams,
  body,
  headers,
  actions,
}) => async (dispatch) => {
  const {
    callback, request, success, failure,
  } = actions;
  dispatch(request());
  try {
    const method = rawMethod.toLowerCase();

    const params = Object.assign({}, rawParams);
    const replacer = (match, p1) => {
      const result = params[p1];
      delete params[p1];
      return result;
    };
    const path = rawPath.replace(/{([^}]*)}/g, replacer);

    const stringParams = Object.keys(params)
      .map(key => `${key}=${params[key]}`)
      .join('&');
    const pathWithParams = stringParams ? [path, stringParams].join('?') : path;

    const session = await Auth.currentSession();
    const config = {
      body,
      headers: Object.assign({ Authorization: session.idToken.jwtToken }, headers),
      response: true,
    };
    const response = await API[method](service, pathWithParams, config);
    dispatch(success(response));
    if (callback) {
      dispatch(callback(response.data));
    }
    return response.data;
  } catch (err) {
    dispatch(failure(err));
    return null;
  }
};

/* eslint-disable-next-line no-unused-vars */
const middlewareAPI = store => next => (action) => {
  if (!action.meta || !action.meta.API) {
    return next(action);
  }
  return next(makeAPICall(action.meta.API));
};
export default middlewareAPI;
