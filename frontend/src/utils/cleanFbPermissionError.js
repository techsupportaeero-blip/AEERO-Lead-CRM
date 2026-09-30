// Facebook sometimes fills a lead form's custom question answer with its own
// permission error instead of the real value. Match on a short, stable
// fragment (no trailing "s") rather than the full message, since Meta's own
// wording for this varies between "enough permission." and
// "enough permissions." - the CRM shows "No Permission" instead either way.
const FB_PERMISSION_ERROR_NEEDLE = 'enough permission';

export const cleanFbPermissionError = (val) => {
  if (typeof val === 'string' && val.toLowerCase().includes(FB_PERMISSION_ERROR_NEEDLE)) {
    return 'No Permission';
  }
  return val;
};
