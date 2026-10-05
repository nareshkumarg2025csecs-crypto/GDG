# Local Team Member Images

Place team member images (.jpg, .jpeg, .png, .webp) in this directory (`public/team/`).

## Advantages of Local Assets:
1. **Zero Cloud Egress**: Browsers cache static images directly from the local web server without querying Supabase Storage buckets.
2. **Instant Rendering**: No network roundtrips to remote cloud storage.
3. **Easy Maintenance**: Simply drop the photo here and specify its path in `src/data/team.ts` (e.g. `image: '/team/rakesh.jpg'`).

## Naming Convention Recommendation:
- `lead.jpg` or `rakesh.jpg`
- `co-lead.jpg` or `kishore.jpg`
- `techops-lead.jpg` or `lokesh.jpg`
- `design-lead.jpg` or `aishwarya.jpg`
- etc.

If no image is provided or if an image file is not found, the website will automatically display a sleek monogram avatar with the team's signature Google colors.
