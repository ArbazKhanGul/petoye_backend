# CloudFront Setup Instructions

## Add to your .env file:

```env
# CloudFront Configuration (replace with your actual CloudFront domain)
CLOUDFRONT_DOMAIN_NAME=your_cloudfront_distribution_domain.cloudfront.net

# Optional: Enable ACLs if your bucket supports them
AWS_S3_ENABLE_ACL=false
```

## To find your CloudFront domain:

1. Go to AWS Console > CloudFront
2. Find your distribution that points to your S3 bucket
3. Copy the "Domain name" (e.g., d1234567890abc.cloudfront.net)
4. Add it to your .env file as CLOUDFRONT_DOMAIN_NAME

## Example:

If your CloudFront domain is `d1234567890abc.cloudfront.net`, add:

```env
CLOUDFRONT_DOMAIN_NAME=d1234567890abc.cloudfront.net
```

## Benefits of CloudFront:

- ✅ Faster global content delivery
- ✅ Better caching and performance
- ✅ Lower bandwidth costs
- ✅ HTTPS by default
- ✅ Custom domain support

## Testing:

Once configured, your files will be served from:
`https://your-cloudfront-domain.cloudfront.net/folder/filename.ext`

Instead of:
`https://bucket-name.s3.region.amazonaws.com/folder/filename.ext`
