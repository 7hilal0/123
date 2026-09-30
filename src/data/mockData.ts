import { User, Community, Post, Comment, Conversation, DirectMessage } from '../types';
import { OFFICIAL_DZCORE_AVATAR } from '../utils/avatarConstants';

export const ADMIN_USER: User = {
  id: 'admin_dzcore',
  username: 'dzcore',
  displayName: 'إدارة DZCORE',
  avatar: OFFICIAL_DZCORE_AVATAR,
  banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
  bio: 'الحساب الرسمي لمنصة DZCORE. فضاء مخصص لتبادل المعرفة البرمجية، النقاشات الهادفة، والمجتمعات التقنية.',
  status: 'online',
  customStatus: 'المنصة جاهزة للاستخدام 🚀',
  badges: ['إدارة المنصة', 'رسمي'],
  karma: 50,
  joinedDate: 'سبتمبر 2026',
  followersCount: 0,
  followingCount: 0,
  isFollowing: false,
  email: 'admin@dzcore.top',
  password: 'admin',
};

// Initial users array contains the official account and a test account
export const MOCK_USERS: User[] = [
  ADMIN_USER,
  {
    id: 'user_member',
    username: 'algerien_dz',
    displayName: 'عضو جزائري',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    banner: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
    bio: 'مهتم بالبرمجة والتطوير والعمل الحر في الجزائر.',
    status: 'online',
    customStatus: 'أستكشف منصة DZCORE',
    badges: ['عضو نشط'],
    karma: 15,
    joinedDate: 'سبتمبر 2026',
    followersCount: 0,
    followingCount: 0,
    isFollowing: false,
    email: 'member@dzcore.top',
    password: '123',
  },
];

export const CURRENT_USER: User | null = null; // Start as guest or prompt to login/register!

export const MOCK_COMMUNITIES: Community[] = [
  {
    id: 'comm_general',
    name: 'المجتمع العام DZCORE',
    slug: 'dz/general',
    description: 'المجتمع الرئيسي لمنصة DZCORE. نقاشات عامة، تبادل للأفكار، وطرح للمواضيع اليومية في مختلف المجالات.',
    icon: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=200&q=80',
    banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    memberCount: 2,
    onlineCount: 2,
    isMember: true,
    category: 'عام',
    createdAt: 'سبتمبر 2026',
    rules: [
      { id: 'r1', title: 'الاحترام المتبادل', description: 'النقاش البناء والمحترم هو أساس المجتمع.' },
      { id: 'r2', title: 'المحتوى الهادف', description: 'نشر مواضيع ذات فائدة للمجتمع وتجنب السبام.' },
    ],
    moderators: [
      {
        username: ADMIN_USER.username,
        displayName: ADMIN_USER.displayName,
        avatar: ADMIN_USER.avatar,
        role: 'إدارة المنصة',
      },
    ],
  },
  {
    id: 'comm_tech',
    name: 'البرمجة والتقنية في الجزائر',
    slug: 'dz/tech',
    description: 'فضاء المطورين والمهندسين الجزائريين. نقاشات في الويب، الذكاء الاصطناعي، الأمن السيبراني، ومصادر التعلم.',
    icon: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=200&q=80',
    banner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    memberCount: 1,
    onlineCount: 1,
    isMember: false,
    category: 'تطوير وبرمجة',
    createdAt: 'سبتمبر 2026',
    rules: [
      { id: 'r1', title: 'مشاركة المعرفة البرمجية', description: 'أجب على استفسارات زملائك وشارك الكود والمشاريع.' },
    ],
    moderators: [
      {
        username: ADMIN_USER.username,
        displayName: ADMIN_USER.displayName,
        avatar: ADMIN_USER.avatar,
        role: 'مشرف',
      },
    ],
  },
  {
    id: 'comm_freelance',
    name: 'العمل الحر والتجارة الإلكترونية',
    slug: 'dz/freelance',
    description: 'كل ما يخص الفريلانس في الجزائر، وسائل الدفع الإلكتروني، تجارب المواقع، والخدمات الرقمية.',
    icon: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=200&q=80',
    banner: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80',
    memberCount: 1,
    onlineCount: 1,
    isMember: false,
    category: 'ريادة وعمل حر',
    createdAt: 'سبتمبر 2026',
    rules: [
      { id: 'r1', title: 'تبادل الخبرات الواقعية', description: 'مشاركة النصائح والحلول المالية الموثوقة.' },
    ],
    moderators: [
      {
        username: ADMIN_USER.username,
        displayName: ADMIN_USER.displayName,
        avatar: ADMIN_USER.avatar,
        role: 'مشرف',
      },
    ],
  },
  {
    id: 'comm_travel',
    name: 'سياحة واستكشاف الجزائر',
    slug: 'dz/travel',
    description: 'جمال 58 ولاية جزائرية، رحلات الصحراء، شواطئ الشمال، والمواقع الأثرية والتراثية العريقة.',
    icon: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=200&q=80',
    banner: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    memberCount: 1,
    onlineCount: 1,
    isMember: false,
    category: 'سياحة واستكشاف',
    createdAt: 'سبتمبر 2026',
    rules: [
      { id: 'r1', title: 'الصور الأصلية', description: 'مشاركة الصور والمعلومات الدقيقة حول الأماكن السياحية.' },
    ],
    moderators: [
      {
        username: ADMIN_USER.username,
        displayName: ADMIN_USER.displayName,
        avatar: ADMIN_USER.avatar,
        role: 'مشرف',
      },
    ],
  },
];

export const MOCK_POSTS: Post[] = [];

export const MOCK_COMMENTS: Record<string, Comment[]> = {};

export const MOCK_CONVERSATIONS: Conversation[] = [];
export const MOCK_DIRECT_MESSAGES: Record<string, DirectMessage[]> = {};

