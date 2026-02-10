<div align="center">

# 🎓 UniEventApp

### Cross-Platform University Event Management Platform

[![React Native](https://img.shields.io/badge/React_Native-0.76-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~52.0-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-11.4-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)

_A comprehensive mobile application connecting university communities through events, clubs, and social interactions_

[Features](#-key-features) • [Tech Stack](#-technology-stack) • [Architecture](#-architecture-highlights) • [Getting Started](#-getting-started)

</div>

---

## 📋 Overview

**UniEventApp** is a production-ready, cross-platform mobile application designed to revolutionize university event management and student engagement. Built with modern React Native technologies, the app provides a seamless experience across iOS, Android, and web platforms.

The application serves as a central hub for university communities, enabling students and faculty to discover events, join clubs, share posts, and connect with peers - all in one intuitive interface.

## ✨ Key Features

### 🎯 Core Functionality

- **Event Management System**
  - Browse and discover university events with advanced filtering
  - Create and manage events with rich media support
  - RSVP and attendance tracking
  - Event categories and tags for easy discovery

- **University Clubs & Organizations**
  - Explore and join student clubs
  - Club-specific event feeds
  - Club membership management
  - Activity tracking and engagement metrics

- **Social Features**
  - Create and share posts with the university community
  - Real-time chat functionality
  - User profiles with customizable settings
  - Follow clubs and receive updates

### 🔐 Authentication & Security

- Firebase Authentication integration
- Secure user session management
- Protected routes and API endpoints
- Role-based access control

### 💡 User Experience

- **Modern, Responsive UI** with React Native Paper
- **Smooth Animations** powered by Reanimated 3
- **Dark/Light Mode** support
- **Offline-First Architecture** with local caching
- **Image Optimization** via Cloudinary CDN
- **Haptic Feedback** for enhanced interactions

### 📱 Cross-Platform

- Native iOS experience
- Native Android experience
- Progressive Web App (PWA) support
- Consistent UI/UX across all platforms

## 🛠 Technology Stack

### Frontend

| Technology                  | Purpose                         | Version |
| --------------------------- | ------------------------------- | ------- |
| **React Native**            | Cross-platform mobile framework | 0.76.9  |
| **Expo**                    | Development platform & tooling  | ~52.0   |
| **TypeScript**              | Type-safe development           | 5.9.2   |
| **Expo Router**             | File-based navigation system    | ~4.0    |
| **React Native Reanimated** | High-performance animations     | ~3.16   |
| **React Native Paper**      | Material Design components      | 5.14.5  |

### State Management & Data Fetching

| Technology               | Purpose                           |
| ------------------------ | --------------------------------- |
| **TanStack React Query** | Server state management & caching |
| **React Context API**    | Global state management           |
| **AsyncStorage**         | Persistent local storage          |

### Backend & Services

| Service        | Purpose                                                |
| -------------- | ------------------------------------------------------ |
| **Firebase**   | Authentication, real-time database, push notifications |
| **PostgreSQL** | Primary relational database                            |
| **Cloudinary** | Image/video hosting and optimization                   |
| **Axios**      | HTTP client for API communication                      |

### Developer Experience

| Tool           | Purpose                      |
| -------------- | ---------------------------- |
| **Jest**       | Unit and integration testing |
| **ESLint**     | Code linting and quality     |
| **TypeScript** | Static type checking         |

## 🏗 Architecture Highlights

### File-Based Routing

Leveraging **Expo Router** for intuitive, type-safe navigation with automatic deep linking support.

### Component Architecture

- **Modular design** with reusable components organized by feature
- **Shared components** for common UI elements
- **Custom hooks** for business logic separation
- **TypeScript interfaces** for type safety across the application

### Performance Optimizations

- **React Query caching** for efficient data fetching
- **Lazy loading** for improved initial load times
- **Image optimization** with Cloudinary transformations
- **Memoization** for expensive computations
- **Virtual scrolling** for large lists

### Responsive Design

- **react-native-responsive-screen** for adaptive layouts
- **react-native-size-matters** for consistent sizing
- Supports devices from small phones to tablets

## 📸 Screenshots

> _Add screenshots of your app here to showcase the UI/UX_

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** - Package manager
- **Expo CLI** - `npm install -g expo-cli`
- **iOS Simulator** (Mac only) - via Xcode
- **Android Studio** - for Android emulator
- **Git** - Version control

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd UniEventApp
   ```

2. **Navigate to the app directory**

   ```bash
   cd uni-event-app
   ```

3. **Install dependencies**

   ```bash
   npm install
   ```

4. **Configure environment variables**

   Create a `.env` file in the `uni-event-app` directory:

   ```env
   # Firebase Configuration
   FIREBASE_API_KEY=your_api_key
   FIREBASE_AUTH_DOMAIN=your_auth_domain
   FIREBASE_PROJECT_ID=your_project_id

   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key

   # Database
   DATABASE_URL=your_postgres_connection_string
   ```

5. **Start the development server**

   ```bash
   npm start
   ```

6. **Run on your platform**
   - **iOS Simulator**: Press `i` or run `npm run ios`
   - **Android Emulator**: Press `a` or run `npm run android`
   - **Web Browser**: Press `w` or run `npm run web`
   - **Physical Device**: Scan the QR code with Expo Go app

### Available Scripts

| Command           | Description                                  |
| ----------------- | -------------------------------------------- |
| `npm start`       | Start the development server with LAN access |
| `npm run android` | Run on Android emulator/device               |
| `npm run ios`     | Run on iOS simulator/device                  |
| `npm run web`     | Run in web browser                           |
| `npm test`        | Run Jest test suite in watch mode            |
| `npm run check`   | Run TypeScript type checking                 |
| `npm run clear`   | Clear cache and restart development server   |
| `npm run lint`    | Run ESLint for code quality                  |

---

## 📁 Project Structure

```
UniEventApp/
│
├── uni-event-app/                 # Main application directory
│   │
│   ├── app/                       # Expo Router - File-based routing
│   │   ├── (tabs)/               # Tab navigator screens
│   │   │   ├── index.tsx         # Home feed
│   │   │   ├── explore.tsx       # Explore events
│   │   │   ├── clubs.tsx         # Clubs directory
│   │   │   └── profile.tsx       # User profile
│   │   │
│   │   ├── (auth)/               # Authentication flow
│   │   │   ├── login.tsx         # Login screen
│   │   │   ├── register.tsx      # Registration screen
│   │   │   └── forgot-password.tsx
│   │   │
│   │   ├── (api)/                # API routes
│   │   │
│   │   ├── event/                # Event detail screens
│   │   ├── add-event/            # Create event flow
│   │   ├── add-club/             # Create club flow
│   │   ├── add-post/             # Create post flow
│   │   ├── chat/                 # Chat functionality
│   │   ├── settings/             # App settings
│   │   ├── user-page/            # User profile pages
│   │   ├── _layout.tsx           # Root layout
│   │   └── index.tsx             # Entry point
│   │
│   ├── components/               # Reusable UI components
│   │   ├── Events/               # Event-related components
│   │   ├── Clubs/                # Club-related components
│   │   ├── Home/                 # Home screen components
│   │   ├── Post/                 # Post components
│   │   └── Shared/               # Shared/common components
│   │
│   ├── context/                  # React Context providers
│   │   ├── AuthContext.tsx       # Authentication state
│   │   └── ThemeContext.tsx      # Theme management
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAuth.ts           # Authentication hook
│   │   ├── useEvents.ts         # Event data hook
│   │   └── useClubs.ts          # Club data hook
│   │
│   ├── utils/                    # Utility functions
│   │   ├── api.ts               # API client configuration
│   │   ├── helpers.ts           # Helper functions
│   │   └── validators.ts        # Form validation
│   │
│   ├── types/                    # TypeScript definitions
│   │   ├── event.types.ts       # Event interfaces
│   │   ├── user.types.ts        # User interfaces
│   │   └── club.types.ts        # Club interfaces
│   │
│   ├── configs/                  # Configuration files
│   │   ├── firebase.config.ts   # Firebase setup
│   │   └── cloudinary.config.ts # Cloudinary setup
│   │
│   ├── assets/                   # Static assets
│   │   ├── images/              # Image files
│   │   ├── fonts/               # Custom fonts
│   │   └── icons/               # Icon assets
│   │
│   ├── data/                     # Static data
│   │
│   ├── app.json                  # Expo configuration
│   ├── package.json              # Dependencies
│   ├── tsconfig.json             # TypeScript configuration
│   └── .env                      # Environment variables
│
├── .github/                      # GitHub configuration
└── babel.config.js               # Babel configuration
```

---

## 💻 Development Best Practices

### Code Quality

- **TypeScript strict mode** enabled for maximum type safety
- **ESLint** configuration for consistent code style
- **Prettier** integration for automatic code formatting
- **Husky** pre-commit hooks (if configured)

### Testing Strategy

- **Unit tests** with Jest for utility functions
- **Component tests** with React Test Renderer
- **Integration tests** for critical user flows
- Run `npm test` to execute the test suite

### State Management Pattern

```typescript
// Using React Query for server state
const { data, isLoading, error } = useQuery({
  queryKey: ['events'],
  queryFn: fetchEvents,
  staleTime: 5 * 60 * 1000, // 5 minutes
})

// Using Context for global UI state
const { theme, toggleTheme } = useTheme()
```

---

## 🎯 Key Technical Highlights

> _For Recruiters & Technical Evaluators_

### Modern React Native Architecture

- ✅ **Latest React Native 0.76** with New Architecture enabled
- ✅ **TypeScript 5.9** throughout the entire codebase
- ✅ **File-based routing** with Expo Router for type-safe navigation
- ✅ **Component-driven development** with modular architecture

### Performance & Optimization

- ✅ **TanStack React Query** for efficient server state management
- ✅ **Reanimated 3** for 60 FPS animations on the UI thread
- ✅ **Lazy loading** and code splitting for optimal bundle size
- ✅ **Image optimization** with Cloudinary CDN integration
- ✅ **Offline-first approach** with local caching strategies

### Full-Stack Integration

- ✅ **Firebase Authentication** for secure user management
- ✅ **PostgreSQL** for relational data storage
- ✅ **RESTful API** integration with Axios
- ✅ **Real-time features** for chat and notifications
- ✅ **Cloud storage** integration (Cloudinary)

### Code Quality & Best Practices

- ✅ **Type-safe** development with TypeScript interfaces
- ✅ **Custom hooks** for reusable business logic
- ✅ **Context API** for global state management
- ✅ **Component testing** with Jest
- ✅ **Responsive design** across all device sizes

### Cross-Platform Excellence

- ✅ **iOS** native experience
- ✅ **Android** native experience
- ✅ **Web** progressive web app support
- ✅ **Consistent UI/UX** across all platforms
- ✅ **Platform-specific optimizations**

---

## 🔧 Technical Skills Demonstrated

This project showcases proficiency in:

**Frontend Development**

- React Native & Expo ecosystem
- TypeScript for large-scale applications
- Complex navigation patterns
- State management (Context API, React Query)
- Animation and gesture handling
- Responsive and adaptive design

**Backend Integration**

- Firebase services (Auth, Realtime DB, Storage)
- RESTful API consumption
- Database design and modeling (PostgreSQL)
- Authentication and authorization flows
- File upload and cloud storage

**Development Practices**

- Git version control
- Component-based architecture
- Custom hooks pattern
- Error handling and validation
- Code organization and modularity
- Cross-platform development

**Tools & Technologies**

- Expo development platform
- TypeScript compilation and type checking
- Package management (npm)
- Testing frameworks (Jest)
- Development debugging tools

---

## 🚦 Current Status

- ✅ **Core Features**: Fully implemented
- ✅ **Authentication**: Complete with Firebase
- ✅ **Event Management**: Fully functional
- ✅ **Club Features**: Operational
- ✅ **Chat System**: Integrated
- ✅ **Cross-Platform**: iOS, Android, Web ready
- 🔄 **In Progress**: Additional features and optimizations

---

## 📚 Learning Resources

If you want to understand the technologies used:

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Query (TanStack)](https://tanstack.com/query/latest)
- [Firebase Documentation](https://firebase.google.com/docs)

---

## 🤝 Contributing

Contributions are welcome! If you'd like to contribute to this project:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Contribution Guidelines

- Follow the existing code style and patterns
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

---

## 📄 License

This project is **private and proprietary**. All rights reserved.

For licensing inquiries, please contact the repository owner.

---

## 📧 Contact & Support

- **Issues**: [GitHub Issues](../../issues)
- **Discussions**: [GitHub Discussions](../../discussions)

For additional questions or collaboration opportunities, please open an issue or contact the maintainers.

---

<div align="center">

### ⭐️ If you find this project interesting, consider giving it a star!

**Built with ❤️ using React Native & Expo**

</div>
