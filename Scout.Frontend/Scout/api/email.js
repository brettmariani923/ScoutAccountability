import nodemailer from "nodemailer";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { image, url, title, email, timestamp } = req.body;

        if (!image || !url || !email) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: process.env.SMTP_SECURE === "true",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        await transporter.sendMail({
            from: process.env.FROM_ADDRESS || process.env.SMTP_USER,
            to: email,
            subject: `Scout Alert - ${url}`,
            html: `
                 <p>Scout detected a blocked site.</p>
            <ul>
                <li><strong>URL:</strong> ${url}</li>
                <li><strong>Title:</strong> ${title}</li>
                <li><strong>Time (UTC):</strong> ${timestamp}</li>
            </ul>
            <p>Screenshot is attached.</p>
            `,
            attachments: [
                {
                    filename: "screenshot.jpg",
                    content: image.replace(/^data:image\/\w+;base64,/, ""),
                    encoding: "base64"
                }
            ]
        });

        return res.status(200).json({ status: "Email sent" });

    } catch (err) {
        console.error("Vercel email API error:", err);
        return res.status(500).json({ error: "Server error", details: err.message });
    }
}
