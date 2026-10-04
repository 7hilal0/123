export type Language = 'en' | 'ar' | 'fr';

export interface Translations {
  // Brand & General
  appName: string;
  appTagline: string;
  welcome: string;
  welcomeSub: string;
  searchPlaceholder: string;
  cancel: string;
  save: string;
  saveChanges: string;
  delete: string;
  edit: string;
  share: string;
  linkCopied: string;
  copied: string;
  justNow: string;

  // Navigation
  navHome: string;
  navExplore: string;
  navCommunities: string;
  navMessages: string;
  navNotifications: string;
  navProfile: string;
  navSettings: string;
  navCreate: string;
  navLogin: string;
  navRegister: string;
  navLogout: string;

  // Feed & Sorting
  feedHot: string;
  feedNew: string;
  feedTop: string;
  feedFollowing: string;
  followingEmptyTitle: string;
  followingEmptyDesc: string;
  explorePeople: string;
  noPostsFound: string;
  startDiscussion: string;
  pinned: string;
  upvote: string;
  downvote: string;
  commentsCount: string;
  saved: string;
  savePost: string;

  // Post Detail & Comments
  backToFeed: string;
  postNotFound: string;
  reply: string;
  writeReply: string;
  sendReply: string;
  deleteComment: string;
  addCommentPlaceholder: string;
  submitComment: string;

  // Create Post
  createPostTitle: string;
  createPostSubtitle: string;
  targetCommunity: string;
  postTypeDiscussion: string;
  postTypeImage: string;
  postTypeLink: string;
  postTitleLabel: string;
  postTitlePlaceholder: string;
  postContentLabel: string;
  postContentPlaceholder: string;
  postImageUpload: string;
  postImageUploadHint: string;
  postImageUrlLabel: string;
  postLinkUrlLabel: string;
  postTagsLabel: string;
  addTag: string;
  livePreview: string;
  publishPost: string;

  // Communities
  exploreCommunities: string;
  exploreCommunitiesSub: string;
  createCommunity: string;
  createCommunityTitle: string;
  communityName: string;
  communityCategory: string;
  communityDesc: string;
  communityIcon: string;
  communityBanner: string;
  uploadIcon: string;
  uploadBanner: string;
  join: string;
  joined: string;
  members: string;
  online: string;
  rules: string;
  about: string;
  categoryAll: string;

  // Messages
  directMessagesTitle: string;
  newChat: string;
  searchFriends: string;
  noMessagesYet: string;
  typeMessagePlaceholder: string;
  attachImage: string;
  send: string;
  selectConversationPrompt: string;
  chooseMemberToChat: string;

  // Profile
  editProfile: string;
  displayName: string;
  username: string;
  email: string;
  password: string;
  bio: string;
  statusMessage: string;
  presenceStatus: string;
  statusOnline: string;
  statusIdle: string;
  statusDnd: string;
  statusOffline: string;
  avatarUpload: string;
  choosePresetAvatar: string;
  bannerUpload: string;
  follow: string;
  following: string;
  followers: string;
  karma: string;
  joinedDate: string;
  profilePosts: string;
  profileComments: string;
  profileSaved: string;

  // Settings
  settingsTitle: string;
  languageSetting: string;
  languageEnglish: string;
  languageArabic: string;
  languageDescription: string;
  dataSetting: string;
  resetAllData: string;
  resetAllDataHint: string;

  // Auth Modal
  loginTitle: string;
  loginSub: string;
  registerTitle: string;
  registerSub: string;
  loginBtn: string;
  registerBtn: string;
  dontHaveAccount: string;
  alreadyHaveAccount: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // Brand & General
    appName: 'DZCORE',
    appTagline: 'Modern Community & Communication Platform',
    welcome: 'Welcome to DZCORE',
    welcomeSub: 'A next-generation community space combining open discussions with real-time direct messaging.',
    searchPlaceholder: 'Search discussions, communities, or members...',
    cancel: 'Cancel',
    save: 'Save',
    saveChanges: 'Save Changes',
    delete: 'Delete',
    edit: 'Edit',
    share: 'Share',
    linkCopied: 'Link copied to clipboard!',
    copied: 'Copied',
    justNow: 'Just now',

    // Navigation
    navHome: 'Home Feed',
    navExplore: 'Explore',
    navCommunities: 'Communities',
    navMessages: 'Direct Messages',
    navNotifications: 'Notifications',
    navProfile: 'Profile',
    navSettings: 'Settings',
    navCreate: 'New Post',
    navLogin: 'Sign In',
    navRegister: 'Sign Up',
    navLogout: 'Sign Out',

    // Feed & Sorting
    feedHot: 'Hot',
    feedNew: 'New',
    feedTop: 'Top',
    feedFollowing: 'Following',
    followingEmptyTitle: 'No posts from people you follow',
    followingEmptyDesc: 'Follow members and creators across the platform to see their latest updates and posts here.',
    explorePeople: 'Explore Members',
    noPostsFound: 'No posts in this feed yet. Be the first to share!',
    startDiscussion: 'Start a Discussion',
    pinned: 'Pinned',
    upvote: 'Upvote',
    downvote: 'Downvote',
    commentsCount: 'comments',
    saved: 'Saved',
    savePost: 'Save',

    // Post Detail & Comments
    backToFeed: 'Back to feed',
    postNotFound: 'Post not found',
    reply: 'Reply',
    writeReply: 'Write your reply...',
    sendReply: 'Send Reply',
    deleteComment: 'Delete',
    addCommentPlaceholder: 'Add a helpful comment or insight...',
    submitComment: 'Post Comment',

    // Create Post
    createPostTitle: 'Create a Discussion',
    createPostSubtitle: 'Share knowledge, ideas, media, or questions with the community.',
    targetCommunity: 'Post to Community',
    postTypeDiscussion: 'Discussion / Article',
    postTypeImage: 'Image / Artwork',
    postTypeLink: 'Link / Video',
    postTitleLabel: 'Title',
    postTitlePlaceholder: 'Write an interesting, descriptive title...',
    postContentLabel: 'Content',
    postContentPlaceholder: 'Write your post details, explanations, or code...',
    postImageUpload: 'Click or drop image from your device or phone',
    postImageUploadHint: 'Supports PNG, JPG, WebP with instant client compression',
    postImageUrlLabel: 'Or enter direct image URL',
    postLinkUrlLabel: 'External URL',
    postTagsLabel: 'Tags',
    addTag: 'Add Tag',
    livePreview: 'Live Preview',
    publishPost: 'Publish Post',

    // Communities
    exploreCommunities: 'Explore Communities',
    exploreCommunitiesSub: 'Join specialized spaces for technology, freelancing, travel, gaming, or create your own hub.',
    createCommunity: 'Create Community',
    createCommunityTitle: 'Found a New Community',
    communityName: 'Community Name',
    communityCategory: 'Category',
    communityDesc: 'Description & Purpose',
    communityIcon: 'Community Icon',
    communityBanner: 'Community Banner',
    uploadIcon: 'Upload Icon',
    uploadBanner: 'Upload Banner',
    join: 'Join',
    joined: 'Joined',
    members: 'members',
    online: 'online',
    rules: 'Rules',
    about: 'About',
    categoryAll: 'All',

    // Messages
    directMessagesTitle: 'Direct Messages',
    newChat: 'New Message',
    searchFriends: 'Search conversations or members...',
    noMessagesYet: 'No direct messages yet. Start a real conversation with any registered member!',
    typeMessagePlaceholder: 'Type a message to',
    attachImage: 'Attach image from device',
    send: 'Send',
    selectConversationPrompt: 'Select a conversation or start a new chat from the member directory.',
    chooseMemberToChat: 'Choose a member to direct message:',

    // Profile
    editProfile: 'Edit Profile',
    displayName: 'Display Name',
    username: 'Username',
    email: 'Email Address',
    password: 'Password',
    bio: 'Biography (Bio)',
    statusMessage: 'Custom Status Message',
    presenceStatus: 'Presence Status',
    statusOnline: 'Online',
    statusIdle: 'Idle / Away',
    statusDnd: 'Do Not Disturb',
    statusOffline: 'Invisible / Offline',
    avatarUpload: 'Upload Profile Avatar',
    choosePresetAvatar: 'Or pick a ready avatar:',
    bannerUpload: 'Upload Profile Banner',
    follow: 'Follow',
    following: 'Following',
    followers: 'followers',
    karma: 'Karma',
    joinedDate: 'Joined',
    profilePosts: 'Posts',
    profileComments: 'Comments',
    profileSaved: 'Saved Posts',

    // Settings
    settingsTitle: 'Preferences & Settings',
    languageSetting: 'Language',
    languageEnglish: 'English (Default)',
    languageArabic: 'العربية (Arabic)',
    languageDescription: 'Choose your preferred language and layout orientation.',
    dataSetting: 'Local Storage & Data',
    resetAllData: 'Reset Demo Data to Initial State',
    resetAllDataHint: 'Clear locally created posts and comments to restore fresh defaults.',

    // Auth Modal
    loginTitle: 'Sign In to DZCORE',
    loginSub: 'Access your profile, direct messages, and subscribed communities.',
    registerTitle: 'Create your DZCORE Account',
    registerSub: 'Join the community to post, comment, and connect directly.',
    loginBtn: 'Sign In',
    registerBtn: 'Create Account',
    dontHaveAccount: "Don't have an account? Sign up",
    alreadyHaveAccount: 'Already have an account? Sign in',
  },

  fr: {
    // Brand & General
    appName: 'DZCORE',
    appTagline: 'Plateforme moderne de communauté et de communication',
    welcome: 'Bienvenue sur DZCORE',
    welcomeSub: 'Un espace communautaire nouvelle génération qui combine discussions ouvertes et messagerie privée en temps réel.',
    searchPlaceholder: 'Rechercher des discussions, communautés ou membres...',
    cancel: 'Annuler',
    save: 'Enregistrer',
    saveChanges: 'Enregistrer les modifications',
    delete: 'Supprimer',
    edit: 'Modifier',
    share: 'Partager',
    linkCopied: 'Lien copié dans le presse-papiers !',
    copied: 'Copié',
    justNow: "À l'instant",

    // Navigation
    navHome: 'Accueil',
    navExplore: 'Explorer',
    navCommunities: 'Communautés',
    navMessages: 'Messages privés',
    navNotifications: 'Notifications',
    navProfile: 'Profil',
    navSettings: 'Paramètres',
    navCreate: 'Nouvelle publication',
    navLogin: 'Connexion',
    navRegister: 'Inscription',
    navLogout: 'Déconnexion',

    // Feed & Sorting
    feedHot: 'Populaire',
    feedNew: 'Nouveau',
    feedTop: 'Meilleur',
    feedFollowing: 'Abonnements',
    followingEmptyTitle: 'Aucune publication des personnes que vous suivez',
    followingEmptyDesc: 'Suivez des membres et créateurs pour voir leurs dernières publications et mises à jour ici.',
    explorePeople: 'Découvrir les membres',
    noPostsFound: 'Aucune publication dans ce fil pour le moment. Soyez le premier à partager !',
    startDiscussion: 'Démarrer une discussion',
    pinned: 'Épinglé',
    upvote: 'J’aime',
    downvote: 'Je n’aime pas',
    commentsCount: 'commentaires',
    saved: 'Enregistré',
    savePost: 'Enregistrer',

    // Post Detail & Comments
    backToFeed: 'Retour au fil',
    postNotFound: 'Publication introuvable',
    reply: 'Répondre',
    writeReply: 'Écrivez votre réponse...',
    sendReply: 'Envoyer la réponse',
    deleteComment: 'Supprimer',
    addCommentPlaceholder: 'Ajoutez un commentaire utile ou une remarque...',
    submitComment: 'Publier le commentaire',

    // Create Post
    createPostTitle: 'Créer une discussion',
    createPostSubtitle: 'Partagez vos connaissances, idées, médias ou questions avec la communauté.',
    targetCommunity: 'Publier dans une communauté',
    postTypeDiscussion: 'Discussion / Article',
    postTypeImage: 'Image / œuvre artistique',
    postTypeLink: 'Lien / Vidéo',
    postTitleLabel: 'Titre',
    postTitlePlaceholder: 'Écrivez un titre clair et intéressant...',
    postContentLabel: 'Contenu',
    postContentPlaceholder: 'Écrivez les détails, explications ou le code de votre publication...',
    postImageUpload: 'Cliquez ou déposez une image depuis votre appareil ou téléphone',
    postImageUploadHint: 'PNG, JPG et WebP avec compression instantanée',
    postImageUrlLabel: "Ou saisissez l'URL directe de l'image",
    postLinkUrlLabel: 'URL externe',
    postTagsLabel: 'Tags',
    addTag: 'Ajouter un tag',
    livePreview: 'Aperçu en direct',
    publishPost: 'Publier',

    // Communities
    exploreCommunities: 'Découvrir les communautés',
    exploreCommunitiesSub: 'Rejoignez des espaces dédiés à la technologie, au freelance, aux voyages et aux jeux, ou créez votre propre communauté.',
    createCommunity: 'Créer une communauté',
    createCommunityTitle: 'Créer une nouvelle communauté',
    communityName: 'Nom de la communauté',
    communityCategory: 'Catégorie',
    communityDesc: 'Description et objectif',
    communityIcon: 'Icône de la communauté',
    communityBanner: 'Bannière de la communauté',
    uploadIcon: 'Téléverser une icône',
    uploadBanner: 'Téléverser une bannière',
    join: 'Rejoindre',
    joined: 'Membre',
    members: 'membres',
    online: 'en ligne',
    rules: 'Règles',
    about: 'À propos',
    categoryAll: 'Tous',

    // Messages
    directMessagesTitle: 'Messages privés',
    newChat: 'Nouveau message',
    searchFriends: 'Rechercher des conversations ou des membres...',
    noMessagesYet: 'Aucun message privé pour le moment. Commencez une conversation avec un membre !',
    typeMessagePlaceholder: 'Écrire un message à',
    attachImage: 'Joindre une image depuis l’appareil',
    send: 'Envoyer',
    selectConversationPrompt: 'Sélectionnez une conversation ou démarrez une nouvelle discussion depuis la liste des membres.',
    chooseMemberToChat: 'Choisissez un membre à contacter :',

    // Profile
    editProfile: 'Modifier le profil',
    displayName: 'Nom affiché',
    username: 'Nom d’utilisateur',
    email: 'Adresse e-mail',
    password: 'Mot de passe',
    bio: 'Biographie',
    statusMessage: 'Message de statut personnalisé',
    presenceStatus: 'Statut de présence',
    statusOnline: 'En ligne',
    statusIdle: 'Inactif / Absent',
    statusDnd: 'Ne pas déranger',
    statusOffline: 'Invisible / Hors ligne',
    avatarUpload: 'Téléverser une photo de profil',
    choosePresetAvatar: 'Ou choisissez un avatar prêt à l’emploi :',
    bannerUpload: 'Téléverser la bannière du profil',
    follow: 'Suivre',
    following: 'Abonné',
    followers: 'abonnés',
    karma: 'Karma',
    joinedDate: 'Inscrit le',
    profilePosts: 'Publications',
    profileComments: 'Commentaires',
    profileSaved: 'Publications enregistrées',

    // Settings
    settingsTitle: 'Préférences et paramètres',
    languageSetting: 'Langue',
    languageEnglish: 'English (Anglais)',
    languageArabic: 'Arabe',
    languageDescription: 'Choisissez votre langue préférée et l’orientation de l’interface.',
    dataSetting: 'Données et stockage local',
    resetAllData: 'Réinitialiser les données à l’état initial',
    resetAllDataHint: 'Effacer les publications et commentaires créés localement pour restaurer les données initiales.',

    // Auth Modal
    loginTitle: 'Se connecter à DZCORE',
    loginSub: 'Accédez à votre profil, vos messages privés et vos communautés.',
    registerTitle: 'Créer votre compte DZCORE',
    registerSub: 'Rejoignez la communauté pour publier, commenter et échanger directement.',
    loginBtn: 'Se connecter',
    registerBtn: 'Créer un compte',
    dontHaveAccount: 'Vous n’avez pas de compte ? Inscrivez-vous',
    alreadyHaveAccount: 'Vous avez déjà un compte ? Connectez-vous',
  },

  ar: {
    // Brand & General
    appName: 'DZCORE',
    appTagline: 'منصة المجتمعات والمحادثات المباشرة الحديثة',
    welcome: 'مرحباً بك في DZCORE',
    welcomeSub: 'منصة اجتماعية تفاعلية تجمع بين نقاشات المجتمعات المفتوحة وغرف المحادثات الخاصة المباشرة.',
    searchPlaceholder: 'ابحث عن مواضيع، مجتمعات، أو أعضاء...',
    cancel: 'إلغاء',
    save: 'حفظ',
    saveChanges: 'حفظ التغييرات',
    delete: 'حذف',
    edit: 'تعديل',
    share: 'مشاركة',
    linkCopied: 'تم نسخ الرابط إلى الحافظة بنجاح!',
    copied: 'تم النسخ',
    justNow: 'الآن',

    // Navigation
    navHome: 'الرئيسية',
    navExplore: 'استكشاف وبحث',
    navCommunities: 'المجتمعات',
    navMessages: 'المحادثات الخاصة',
    navNotifications: 'الإشعارات',
    navProfile: 'ملفي الشخصي',
    navSettings: 'الإعدادات',
    navCreate: 'نشر',
    navLogin: 'تسجيل الدخول',
    navRegister: 'إنشاء حساب',
    navLogout: 'تسجيل الخروج',

    // Feed & Sorting
    feedHot: 'الرائج',
    feedNew: 'الجديد',
    feedTop: 'الأفضل',
    feedFollowing: 'من أتابعهم',
    followingEmptyTitle: 'لا توجد منشورات من الأشخاص الذين تتابعهم',
    followingEmptyDesc: 'تابع الأعضاء وصنّاع المحتوى في المنصة لتشاهد أحدث منشوراتهم وتحديثاتهم هنا فور نشرها.',
    explorePeople: 'استكشاف الأعضاء ومتابعتهم',
    noPostsFound: 'لا توجد منشورات في هذه الخلاصة حالياً. كن أول من ينشر!',
    startDiscussion: 'ابدأ نقاشاً في المجتمع',
    pinned: 'مثبت',
    upvote: 'تأييد',
    downvote: 'خفض',
    commentsCount: 'تعليق',
    saved: 'محفوظ',
    savePost: 'حفظ',

    // Post Detail & Comments
    backToFeed: 'العودة للخلاصة',
    postNotFound: 'المنشور غير موجود',
    reply: 'رد',
    writeReply: 'اكتب ردك...',
    sendReply: 'إرسال الرد',
    deleteComment: 'حذف',
    addCommentPlaceholder: 'أضف تعليقاً بنّاءً أو استفساراً...',
    submitComment: 'إرسال التعليق',

    // Create Post
    createPostTitle: 'منشور جديد',
    createPostSubtitle: 'شارك خبراتك، أفكارك، أو استفساراتك مع الجميع.',
    targetCommunity: 'النشر في مجتمع',
    postTypeDiscussion: 'نقاش ومقال',
    postTypeImage: 'صورة أو عمل فني',
    postTypeLink: 'رابط خارجي أو فيديو',
    postTitleLabel: 'عنوان الموضوع',
    postTitlePlaceholder: 'اكتب عنواناً واضحاً ومحفزاً للنقاش...',
    postContentLabel: 'محتوى الموضوع',
    postContentPlaceholder: 'اكتب تفاصيل الموضوع والشرح...',
    postImageUpload: 'انقر أو اسحب صورة من جهازك أو هاتفك',
    postImageUploadHint: 'يدعم PNG و JPG و WebP مع ضغط سريع للملفات',
    postImageUrlLabel: 'أو أدخل رابط صورة مباشر',
    postLinkUrlLabel: 'رابط خارجي (URL)',
    postTagsLabel: 'الوسوم (الهاشتاغات)',
    addTag: 'إضافة وسم',
    livePreview: 'معاينة حية',
    publishPost: 'نشر الموضوع الآن',

    // Communities
    exploreCommunities: 'استكشاف المجتمعات',
    exploreCommunitiesSub: 'انضم إلى مجتمعات متخصصة في البرمجة والتقنية والعمل الحر أو أسس مجتمعك الخاص.',
    createCommunity: 'تأسيس مجتمع جديد',
    createCommunityTitle: 'تأسيس مجتمع جديد',
    communityName: 'اسم المجتمع',
    communityCategory: 'التصنيف',
    communityDesc: 'وصف المجتمع وهدفه',
    communityIcon: 'أيقونة المجتمع',
    communityBanner: 'صورة غلاف المجتمع',
    uploadIcon: 'رفع أيقونة',
    uploadBanner: 'رفع غلاف',
    join: 'انضمام',
    joined: 'منضم',
    members: 'عضو',
    online: 'متصل',
    rules: 'القواعد',
    about: 'حول',
    categoryAll: 'الكل',

    // Messages
    directMessagesTitle: 'المحادثات الخاصة',
    newChat: 'محادثة جديدة',
    searchFriends: 'ابحث عن صديق أو محادثة...',
    noMessagesYet: 'لا توجد محادثات حتى الآن. ابدأ محادثة مباشرة مع أي عضو مسجل!',
    typeMessagePlaceholder: 'اكتب رسالة إلى',
    attachImage: 'إرفاق صورة من جهازك',
    send: 'إرسال',
    selectConversationPrompt: 'اختر محادثة من القائمة أو ابدأ محادثة جديدة من دليل الأعضاء.',
    chooseMemberToChat: 'اختر عضواً لبدء مراسلته مباشرة:',

    // Profile
    editProfile: 'تعديل الملف الشخصي',
    displayName: 'الاسم الظاهر',
    username: 'اسم المستخدم',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    bio: 'النبذة التعريفية (Bio)',
    statusMessage: 'رسالة الحالة المخصصة',
    presenceStatus: 'حالة التواجد',
    statusOnline: 'متصل الآن',
    statusIdle: 'غائب مؤقتاً',
    statusDnd: 'عدم الإزعاج',
    statusOffline: 'مخفي / غير متصل',
    avatarUpload: 'رفع صورة شخصية',
    choosePresetAvatar: 'أو اختر صورة جاهزة:',
    bannerUpload: 'رفع غلاف الحساب',
    follow: 'متابعة',
    following: 'تتابعه',
    followers: 'متابع',
    karma: 'نقاط الكارما',
    joinedDate: 'تاريخ الانضمام',
    profilePosts: 'المنشورات',
    profileComments: 'التعليقات',
    profileSaved: 'المحفوظات',

    // Settings
    settingsTitle: 'التفضيلات والإعدادات',
    languageSetting: 'لغة الواجهة',
    languageEnglish: 'English (الإنجليزية)',
    languageArabic: 'العربية (Arabic)',
    languageDescription: 'اختر لغة الواجهة واتجاه العرض المفضل لك.',
    dataSetting: 'البيانات والتخزين المحلي',
    resetAllData: 'إعادة ضبط البيانات للحالة الافتراضية',
    resetAllDataHint: 'مسح المنشورات والرسائل المنشأة محلياً واستعادة البيانات الأولية.',

    // Auth Modal
    loginTitle: 'تسجيل الدخول إلى DZCORE',
    loginSub: 'سجل دخولك للتفاعل مع المجتمعات والمحادثات والملف الشخصي.',
    registerTitle: 'إنشاء حساب جديد في DZCORE',
    registerSub: 'انضم إلى مجتمع DZCORE للمشاركة والنقاش والمراسلة المباشرة.',
    loginBtn: 'دخول إلى الحساب',
    registerBtn: 'إنشاء الحساب وبدء الاستخدام',
    dontHaveAccount: 'ليس لديك حساب؟ أنشئ حساباً جديداً',
    alreadyHaveAccount: 'لديك حساب بالفعل؟ تسجيل الدخول',
  },
};
