export function musicRequestCurrent(request, currentRequest, enabled, volume, hidden) {
  return request === currentRequest && enabled && volume > 0 && !hidden;
}
