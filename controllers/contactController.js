const sendEmail = require("../utils/sendEmail");

exports.submitInquiry = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and message are required.",
      });
    }

    await sendEmail({
      to: process.env.SMTP_USER,
      subject: `New Contact Inquiry from ${name}`,
      html: `
        <p>You've received a new inquiry from the contact form.</p>
        <p>
          <strong>Name:</strong> ${name}<br/>
          <strong>Email:</strong> ${email}<br/>
          <strong>Phone:</strong> ${phone || "—"}
        </p>
        <h3>Message</h3>
        <p>${message.replace(/\n/g, "<br/>")}</p>
      `,
    });
    res.json({
      success: true,
      message: "Your message has been sent. We'll get back to you soon.",
    });
  } catch (err) {
    console.error("Contact inquiry email failed:", err.message);
    res.status(500).json({
      success: false,
      message: "Could not send your message. Please try again shortly.",
    });
  }
};
