# Admin Guide

Complete guide for administrators managing the Telegram NFT Case Opener platform.

## Table of Contents

1. [Accessing the Admin Panel](#accessing-the-admin-panel)
2. [Dashboard Overview](#dashboard-overview)
3. [Managing Cases](#managing-cases)
4. [NFT Data Management](#nft-data-management)
5. [User Management](#user-management)
6. [Configuration Management](#configuration-management)
7. [Monitoring and Analytics](#monitoring-and-analytics)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Accessing the Admin Panel

### Prerequisites

To access the admin panel, you must:
1. Be designated as admin in the backend configuration
2. Have your Telegram username set in `ADMIN_USERNAME` environment variable
3. Be authenticated in the Mini App

### Accessing the Panel

1. Open the Telegram Mini App
2. Navigate to `/admin` in the URL or use the admin menu (if visible)
3. The admin panel will load if you have proper permissions

**URL**: `https://your-app.vercel.app/admin`

### Admin Panel Structure

The admin panel has four main sections:

- **Dashboard**: Overview statistics and metrics
- **Cases**: Create and manage cases
- **NFT Data**: Update and monitor NFT information
- **Users**: Search, view, and manage users

---

## Dashboard Overview

### Key Metrics

The dashboard displays real-time statistics:

#### User Statistics
- **Total Users**: All registered users
- **Active Users**: Users who opened cases in last 7 days
- **Blocked Users**: Users currently blocked from opening cases
- **New Users Today**: Registrations in last 24 hours

#### Case Statistics
- **Total Cases**: All cases in system
- **Active Cases**: Cases currently available to users
- **Total Openings**: All-time case openings
- **Openings Today**: Case openings in last 24 hours

#### NFT Statistics
- **Total NFTs**: All NFTs in database
- **By Rarity**: Breakdown of NFTs by rarity level
  - Common
  - Uncommon
  - Rare
  - Epic
  - Legendary

#### Revenue Statistics
- **Total Revenue**: All-time coins spent on cases
- **Revenue Today**: Coins spent in last 24 hours
- **Revenue This Week**: Coins spent in last 7 days
- **Average per Opening**: Mean revenue per case opening

### Graphs and Charts

(Future feature) Visual representations:
- User growth over time
- Opening trends by case type
- Revenue trends
- Rarity distribution

### Quick Actions

Dashboard quick actions:
- **Update NFT Data**: Trigger manual NFT scrape
- **Create New Case**: Jump to case creation
- **View Recent Users**: See latest registrations
- **Export Statistics**: Download CSV report

---

## Managing Cases

### Viewing Cases

The Cases page shows all cases with:
- Case name and description
- Price in coins
- Active/Inactive status
- Number of NFTs in case
- Total openings
- Edit and delete buttons

### Creating a New Case

1. Click "Create New Case" button
2. Fill in the case details:
   - **Name**: Case display name (e.g., "Bronze Case")
   - **Description**: Brief description of contents
   - **Price**: Cost in coins (positive integer)
   - **Image URL**: Link to case image
3. Click "Create Case"
4. The case is created but has no NFTs yet

### Adding NFTs to a Case

After creating a case:

1. Click "Edit" on the case
2. Go to "NFT Items" section
3. Click "Add NFT"
4. Select NFT from dropdown
5. Set drop rate (percentage)
6. Click "Add"
7. Repeat for all NFTs

**Important**: Total drop rates should equal 100%

### Editing a Case

1. Click "Edit" button on any case
2. Modify any field:
   - Name
   - Description
   - Price
   - Image URL
   - Active status
   - NFT items and drop rates
3. Click "Save Changes"

### Drop Rate Configuration

Drop rates determine NFT probability:

**Example Configuration**:
```
NFT A: 45% (Common)
NFT B: 30% (Common)
NFT C: 15% (Uncommon)
NFT D: 8% (Rare)
NFT E: 2% (Epic)
Total: 100%
```

**Tips**:
- Higher rarity = lower drop rate
- Total must equal 100%
- Use decimals for precision (e.g., 2.5%)
- Test drop rates before activating

### Activating/Deactivating Cases

To control case availability:

1. Edit the case
2. Toggle "Active" checkbox
3. Save changes

**Active**: Users can see and open the case
**Inactive**: Case is hidden from users (existing openings preserved)

### Deleting Cases

⚠️ **Warning**: Deletion is permanent!

1. Click "Delete" button on case
2. Confirm deletion
3. Case and all associated data are removed

**Note**: Opening history is preserved but case name shows as "Deleted Case"

### Exporting Case Configuration

To backup or duplicate a case:

1. Click "Export" on the case
2. JSON configuration is downloaded
3. Save the file for backup or sharing

**Export includes**:
- Case details (name, description, price, image)
- All NFT items with drop rates

### Importing Case Configuration

To restore or duplicate a case:

1. Click "Import Configuration"
2. Upload JSON file or paste JSON
3. Review the configuration
4. Click "Import"
5. New case is created with same settings

**Use cases**:
- Backup and restore
- Duplicate cases with modifications
- Share configurations between environments

---

## NFT Data Management

### NFT Data Overview

The NFT Data page shows:
- **Last Update**: When NFTs were last scraped
- **Next Scheduled Update**: When next auto-update occurs
- **Total NFTs**: Number of NFTs in database
- **Update Status**: Whether update is running

### Automated Updates

NFT data is automatically updated:
- **Schedule**: Daily at 6:00 AM UTC
- **Source**: GetGems collection (configured in env)
- **Process**: Scrapes NFT metadata and updates database

### Manual Update

To trigger an immediate update:

1. Go to "NFT Data" page
2. Click "Update NFT Data Now"
3. Wait for update to complete (may take 1-5 minutes)
4. Review update results

**Update Results**:
- NFTs Created: New NFTs added
- NFTs Updated: Existing NFTs refreshed
- Errors: Any failures during scraping

### Update Process

The scraper:
1. Fetches NFT list from GetGems
2. Extracts metadata (name, image, rarity, value)
3. Creates new NFTs or updates existing ones
4. Logs results and errors

### Monitoring Updates

Check update status:
- **Is Running**: Shows if update is in progress
- **Last Result**: Success/failure of last update
- **Error Count**: Number of errors in last update
- **NFT Count**: Total NFTs after update

### Troubleshooting Updates

**Update fails**:
- Check `NFT_DATA_SOURCE_URL` is correct
- Verify GetGems collection is accessible
- Review backend logs for errors
- Ensure database connection is stable

**No new NFTs**:
- Collection may not have new items
- Scraper may be filtering duplicates
- Check source URL is correct

**Slow updates**:
- Large collections take longer
- Network speed affects scraping
- Consider increasing timeout settings

---

## User Management

### Searching Users

Find users by:
- **Username**: Telegram username
- **Telegram ID**: Numeric Telegram ID
- **Name**: First or last name

**Search tips**:
- Partial matches work
- Search is case-insensitive
- Leave empty to see recent users

### User Details

Each user entry shows:
- **Telegram ID**: Unique identifier
- **Username**: @username
- **Name**: First and last name
- **Balance**: Current coin balance
- **Total Opened**: Cases opened
- **Level**: Current level
- **Experience**: XP points
- **Status**: Active or Blocked
- **Member Since**: Registration date

### Blocking Users

To prevent abuse:

1. Search for the user
2. Click "Block" button
3. Confirm the action
4. User is immediately blocked

**Effects of blocking**:
- Cannot open cases
- Cannot sell NFTs
- Can still view inventory and history
- Receives "User is blocked" error

**When to block**:
- Suspected cheating or exploitation
- Abuse of rate limits
- Violation of terms of service
- Fraudulent activity

### Unblocking Users

To restore access:

1. Search for the blocked user
2. Click "Unblock" button
3. Confirm the action
4. User can immediately resume activity

### User Statistics

View detailed user stats:
- Opening history
- Inventory contents
- Balance changes over time
- Level progression

(Future feature) Click on user to see full profile

### Bulk Actions

(Future feature) Perform actions on multiple users:
- Bulk block/unblock
- Grant bonus balance
- Send notifications
- Export user list

---

## Configuration Management

### Exporting Configuration

Export entire system configuration:

1. Go to "Configuration" section
2. Click "Export All"
3. JSON file is downloaded

**Export includes**:
- All cases with NFT items
- Drop rate configurations
- Case metadata

**Use cases**:
- Full system backup
- Migration to new environment
- Configuration versioning

### Importing Configuration

Restore or migrate configuration:

1. Click "Import Configuration"
2. Upload JSON file
3. Review changes (shows what will be created/updated)
4. Confirm import
5. Configuration is applied

⚠️ **Warning**: Import may overwrite existing cases

### Configuration Versioning

(Future feature) Track configuration changes:
- Version history
- Rollback capability
- Change logs
- Diff viewer

---

## Monitoring and Analytics

### Real-Time Monitoring

Monitor system health:
- **Active Users**: Currently online users
- **Requests per Minute**: API request rate
- **Error Rate**: Percentage of failed requests
- **Database Performance**: Query response times

### Analytics Dashboard

(Future feature) Advanced analytics:
- User retention rates
- Case popularity rankings
- Revenue forecasting
- Rarity distribution analysis

### Logs and Debugging

Access system logs:
- **Backend Logs**: Render dashboard
- **Frontend Logs**: Vercel dashboard
- **Database Logs**: Supabase dashboard

**Log levels**:
- INFO: Normal operations
- WARN: Potential issues
- ERROR: Failures requiring attention

### Alerts and Notifications

(Future feature) Set up alerts for:
- High error rates
- Unusual activity patterns
- System downtime
- Database issues

---

## Best Practices

### Case Creation

**Do**:
- Test drop rates before activating
- Use clear, descriptive names
- Set reasonable prices
- Include variety of rarities
- Verify total drop rates = 100%

**Don't**:
- Create cases with only common NFTs
- Set prices too high (users need balance)
- Use misleading descriptions
- Forget to add NFTs to new cases

### Drop Rate Guidelines

**Recommended distributions**:

**Budget Case** (100 coins):
- Common: 70%
- Uncommon: 20%
- Rare: 8%
- Epic: 2%

**Mid-Tier Case** (250 coins):
- Common: 50%
- Uncommon: 30%
- Rare: 15%
- Epic: 5%

**Premium Case** (500+ coins):
- Common: 30%
- Uncommon: 35%
- Rare: 25%
- Epic: 8%
- Legendary: 2%

### NFT Management

**Best practices**:
- Update NFT data regularly (daily recommended)
- Monitor for scraping errors
- Verify NFT values are reasonable
- Remove outdated NFTs from cases
- Keep NFT images accessible

### User Management

**Guidelines**:
- Investigate before blocking users
- Document reasons for blocks
- Respond to unblock requests promptly
- Monitor for abuse patterns
- Communicate policy changes

### Security

**Important**:
- Never share admin credentials
- Use strong JWT secrets
- Regularly review user activity
- Monitor for suspicious patterns
- Keep backend environment variables secure

### Performance

**Optimization tips**:
- Limit active cases to 5-10
- Keep NFT images optimized (<500KB)
- Monitor database size
- Archive old opening history
- Use CDN for static assets

---

## Troubleshooting

### Common Issues

#### "Cannot connect to server"
**Cause**: Backend is sleeping (free tier)
**Solution**: Wait 30 seconds for backend to wake up

#### "NFT update failed"
**Cause**: Scraper error or network issue
**Solution**: 
- Check backend logs
- Verify NFT_DATA_SOURCE_URL
- Try manual update
- Check GetGems accessibility

#### "Case not appearing for users"
**Cause**: Case is inactive or has no NFTs
**Solution**:
- Verify case is active
- Ensure NFTs are added
- Check drop rates total 100%

#### "User reports unfair results"
**Cause**: User doesn't understand provably fair
**Solution**:
- Guide user to verification page
- Explain provably fair system
- Verify result yourself

### Database Issues

**Connection errors**:
- Check Supabase status
- Verify credentials in env vars
- Review connection limits

**Slow queries**:
- Check database size
- Review indexes
- Consider upgrading Supabase tier

### Performance Issues

**Slow admin panel**:
- Check backend response times
- Review database query performance
- Optimize large data fetches

**High error rates**:
- Review backend logs
- Check rate limiting settings
- Monitor for abuse

### Getting Help

1. **Check Logs**: Review backend and frontend logs
2. **Documentation**: Read [DEPLOYMENT.md](./DEPLOYMENT.md) and [SECURITY.md](./SECURITY.md)
3. **Community**: Ask in developer community
4. **Support**: Contact platform support (Render, Vercel, Supabase)

---

## Advanced Topics

### Custom NFT Sources

To use a different NFT source:

1. Modify `backend/src/services/nftScraper.ts`
2. Update scraping logic for new source
3. Test thoroughly before deploying
4. Update `NFT_DATA_SOURCE_URL` env var

### Custom Drop Rate Algorithms

To implement custom probability logic:

1. Modify `backend/src/services/caseService.ts`
2. Update `calculateDropProbabilities` function
3. Ensure provably fair verification still works
4. Test extensively

### Multi-Admin Setup

To add multiple admins:

1. Modify `backend/src/middleware/auth.ts`
2. Change `ADMIN_USERNAME` to support array
3. Update admin check logic
4. Redeploy backend

### API Extensions

To add custom endpoints:

1. Create new route file in `backend/src/routes/`
2. Implement route handlers
3. Register route in `backend/src/index.ts`
4. Update API documentation

---

## Maintenance Schedule

### Daily
- Review dashboard statistics
- Check for user reports
- Monitor error logs

### Weekly
- Verify NFT data is updating
- Review case performance
- Check for abuse patterns
- Backup configuration

### Monthly
- Analyze user trends
- Optimize case offerings
- Review and adjust drop rates
- Update documentation

### Quarterly
- Full system audit
- Security review
- Performance optimization
- Feature planning

---

## Appendix

### Keyboard Shortcuts

(Future feature)
- `Ctrl+D`: Open dashboard
- `Ctrl+C`: Create new case
- `Ctrl+U`: Update NFT data
- `Ctrl+S`: Search users

### API Endpoints for Admins

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.

Key admin endpoints:
- `GET /api/admin/statistics`
- `GET /api/admin/users`
- `POST /api/admin/cases`
- `POST /api/admin/nft/update`

### Configuration File Format

Case configuration JSON structure:

```json
{
  "case": {
    "name": "Example Case",
    "description": "Description here",
    "price": 100,
    "imageUrl": "https://example.com/image.png"
  },
  "items": [
    {
      "nftId": 1,
      "dropRate": 50.0
    },
    {
      "nftId": 2,
      "dropRate": 30.0
    },
    {
      "nftId": 3,
      "dropRate": 20.0
    }
  ]
}
```

---

**For technical support, refer to [DEPLOYMENT.md](./DEPLOYMENT.md) and [SECURITY.md](./SECURITY.md)**
