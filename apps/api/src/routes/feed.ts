import express, { Request, Response } from 'express';

const router = express.Router();

// Placeholder for dynamic home feed data
router.get('/dynamic-feed', (req: Request, res: Response) => {
  try {
    // In a real application, this would fetch personalized data
    // based on user preferences, recent activity, family relationships, etc.
    const dummyFeedData = [
      {
        id: '1',
        type: 'photo-update',
        title: `New Photos from Family Reunion`,
        description: `Aunt Carol just uploaded 25 new photos from the summer family reunion!`,
        imageUrl: '/family-logo.webp',
        link: '/photos/reunion-2024',
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        type: 'event-reminder',
        title: `Reminder: Grandma's Birthday Next Week`,
        description: `Don't forget to send Grandma a card or give her a call!`,
        link: '/calendar/grandmas-birthday',
        timestamp: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      },
      {
        id: '3',
        type: 'blog-post',
        title: `Uncle Bob's New Recipe: Spicy Chili`,
        description: `Uncle Bob just shared his secret recipe for spicy chili. Perfect for a cold evening!`,
        link: '/blog/spicy-chili-recipe',
        timestamp: new Date(Date.now() - 172800000).toISOString(), // Two days ago
      },
      {
        id: '4',
        type: 'family-milestone',
        title: `Happy 5th Anniversary, Sarah & Tom!`,
        description: `Celebrate Sarah and Tom's 5th wedding anniversary today!`,
        link: '/profile/sarah-tom',
        timestamp: new Date(Date.now() - 259200000).toISOString(), // Three days ago
      },
    ];

    res.status(200).json(dummyFeedData);
  } catch (err) {
    console.error('Error fetching dynamic feed:', err);
    res.status(500).json({ message: 'Failed to retrieve feed data' });
  }
});

export default router;