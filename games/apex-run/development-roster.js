export const DEVELOPMENT_ROSTER_PARAM="devRoster";

function loopbackHost(hostname){return hostname==="localhost"||hostname==="127.0.0.1"||hostname==="::1"||hostname==="[::1]"}

export function developmentRosterAccess({search=globalThis.location?.search||"",hostname=globalThis.location?.hostname||""}={}){
  const value=new URLSearchParams(search).get(DEVELOPMENT_ROSTER_PARAM),local=loopbackHost(hostname);
  return Object.freeze({development:local&&value!=="0",disabled:local&&value==="0"});
}

export function carryDevelopmentRoster(url,access){if(access?.development)url.searchParams.set(DEVELOPMENT_ROSTER_PARAM,"1");else if(access?.disabled)url.searchParams.set(DEVELOPMENT_ROSTER_PARAM,"0");return url}
