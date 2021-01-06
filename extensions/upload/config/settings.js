module.exports = {
  provider: process.env.UPLOAD_PROVIDER,
  providerOptions: {
    key: process.env.DO_SPACE_ACCESS_KEY,
    secret: process.env.DO_SPACE_SECRET_KEY,
    region: process.env.DO_SPACE_REGION,
    space: process.env.DO_SPACE_BUCKET,
    access: process.env.DO_SPACE_ACCESS,
    cdn: process.env.DO_SPACE_CDN,
  }
};