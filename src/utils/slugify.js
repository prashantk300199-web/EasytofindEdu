import slugifyLib from "slugify";

const generateSlug = (text) => {
  return slugifyLib(text, {
    lower: true,
    strict: true,
    trim: true,
  });
};

export default generateSlug;