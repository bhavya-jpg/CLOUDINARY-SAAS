# Cloudinary-SaaS

Cloudinary-SaaS is a SaaS product built using **Next.js**, **Clerk**, **Prisma**, and **Neon** that allows users to upload and manage photos and videos with intelligent AI features for compression, resizing, and focus optimization.

## Features:

- **User Authentication**: Secure sign-up and login using **Clerk** for easy and scalable authentication.
- **AI-Powered Video Upload & Preview**: Upload videos with automatic AI-driven scene detection and hover-to-preview functionality, similar to YouTube. Videos are also intelligently compressed and available for download in **ZIP** format.
- **Intelligent Image Resizing**: Upload images and resize them according to popular formats (Instagram square, portrait, etc.) while keeping the main subject (e.g., faces) in focus. Cloudinary's AI ensures that even after resizing, the key parts of the image remain sharp.
- **Compression and Download**: Both photos and videos are compressed for optimal performance and can be downloaded after resizing or processing.

## Tech Stack:
- **Next.js** (Frontend)
- **Clerk** (Authentication)
- **Prisma** (ORM)
- **Neon** (Database)
- **Cloudinary** (AI Image & Video Processing)

## Installation:

1. Clone the repository:
    ```bash
    git clone https://github.com/your-username/cloudinary-saas.git
    cd cloudinary-saas
    ```
2. Install dependencies:
    ```bash
    npm install
    ```
3. Set up the `.env` file with your environment variables (Clerk, Cloudinary, etc.).
4. Start the project:
    ```bash
    npm run dev
    ```

## Contributing:
Feel free to fork the repo, raise issues, and submit pull requests. Contributions are welcome!

## License:
Distributed under the MIT License. See `LICENSE` for more information.