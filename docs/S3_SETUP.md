# S3 File Storage Setup Guide

This guide explains how to configure AWS S3 for file storage in the Petoye backend.

## Overview

The application has been updated to use AWS S3 for file storage instead of local file storage. This provides better scalability, reliability, and performance for media files.

## Required Environment Variables

Add the following environment variables to your `.env` file:

```env
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_S3_BUCKET_NAME=your_s3_bucket_name
```

## AWS S3 Setup Steps

### 1. Create an S3 Bucket

1. Log in to the AWS Console
2. Navigate to S3 service
3. Create a new bucket with a unique name (e.g., `petoye-media-storage`)
4. Choose your preferred region
5. Configure bucket settings:
   - **Block Public Access**: Disable "Block all public access" if you want direct file access
   - **Versioning**: Enable if you want file versioning
   - **Server-side encryption**: Enable for security

### 2. Configure Bucket Policy (for public read access)

If you want files to be publicly accessible, add this bucket policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

### 3. Create IAM User and Access Keys

1. Navigate to IAM service in AWS Console
2. Create a new user (e.g., `petoye-s3-user`)
3. Attach the following policy to the user:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    }
  ]
}
```

4. Generate access keys for this user
5. Copy the Access Key ID and Secret Access Key to your environment variables

## File Organization

Files are automatically organized in S3 with the following folder structure:

```
your-bucket-name/
├── profile/          # Profile images
├── posts/           # Post media files and thumbnails
├── petlisting/      # Pet listing media files
├── chat/            # Chat media files
└── uploads/         # Other files (fallback)
```

## Supported File Types

The multer configuration supports:

- **Images**: All image formats (JPEG, PNG, GIF, WebP, etc.)
- **Videos**: MP4, MOV, AVI, WMV, FLV, MKV, WebM
- **Documents**: PDF, Word, Excel, PowerPoint, text files
- **Archives**: ZIP, RAR

## File Size Limits

- Maximum file size: 30MB per file
- This can be adjusted in the multer configuration if needed

## Migration from Local Storage

If you have existing files in local storage, you'll need to:

1. Upload existing files to S3 manually or via AWS CLI
2. Update database records to point to S3 URLs instead of local paths
3. The application maintains backwards compatibility with local files for existing records

## Testing the Setup

1. Ensure all environment variables are set correctly
2. Restart the application
3. Try uploading a file through any upload endpoint
4. Verify the file appears in your S3 bucket
5. Check that the API returns S3 URLs in responses

## Troubleshooting

### Common Issues:

1. **Access Denied Errors**

   - Check IAM permissions
   - Verify bucket policy
   - Ensure access keys are correct

2. **Files Not Uploading**

   - Check AWS credentials in environment variables
   - Verify bucket name is correct
   - Check network connectivity to AWS

3. **Files Not Accessible**
   - Verify bucket policy allows public read access
   - Check file ACL settings (should be public-read)

### Environment Variables Checklist:

- [ ] AWS_REGION is set to your bucket's region
- [ ] AWS_ACCESS_KEY_ID is valid
- [ ] AWS_SECRET_ACCESS_KEY is valid
- [ ] AWS_S3_BUCKET_NAME matches your actual bucket name

## Cost Considerations

- S3 charges for storage, requests, and data transfer
- Consider setting up lifecycle policies to move old files to cheaper storage classes
- Monitor usage through AWS Cost Explorer

## Security Best Practices

1. Use IAM roles instead of access keys when possible (for EC2 instances)
2. Enable bucket versioning and logging
3. Consider enabling MFA delete for production buckets
4. Regularly rotate access keys
5. Monitor access patterns and set up alerts for unusual activity
