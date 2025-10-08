// import nodemailer from "nodemailer";
// import twilio from "twilio";
// import { supabase } from "../utils/supabaseClient.js";
// import { asyncHandler } from "../utils/asynchandler.js";

// // helper: send email
// // const sendEmail = async (to, subject, message) => {
// //   const transporter = nodemailer.createTransport({
// //     service: "gmail",
// //     auth: {
// //       user: process.env.ALERT_EMAIL_USER,
// //       pass: process.env.ALERT_EMAIL_PASS,
// //     },
// //   });
  

// //   await transporter.sendMail({
// //     from: `"NCPIRF Alerts" <${process.env.ALERT_EMAIL_USER}>`,
// //     to,
// //     subject,
// //     text: message,
// //   });
// // };
// // import nodemailer from "nodemailer";

// export const sendEmail = async (to, subject, message) => {
//   const transporter = nodemailer.createTransport({
//     host: "smtp.mailtrap.io",
//     port: 2525,
//     auth: {
//       user: process.env.ALERT_EMAIL_USER, // Mailtrap username
//       pass: process.env.ALERT_EMAIL_PASS, // Mailtrap password
//     },
//   });

//   const info = await transporter.sendMail({
//     from: `"NCPIRF Alerts" <no-reply@ncpirf.in>`,
//     to,
//     subject,
//     text: message,
//   });

//   console.log(" Email sent:", info.messageId);
//   console.log(" Preview it at:", nodemailer.getTestMessageUrl(info) || "Mailtrap dashboard");
// };


// // helper: send SMS (currently disabled)
// // const sendSMS = async (phone, message) => {
// //   const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
// //   await client.messages.create({
// //     body: message,
// //     from: process.env.TWILIO_PHONE_NUMBER,
// //     to: phone,
// //   });
// // };

// export const sendAlert = asyncHandler(async (req, res) => {
//   const { atm_id, risk_score, cluster_id, severity, reason } = req.body;

//   if (!atm_id || !severity) {
//     return res.status(400).json({ success: false, message: "Missing ATM ID or severity" });
//   }

//   // fetch all registered users (officers)
//   const { data: users, error } = await supabase
//     .from("auth.users")
//     .select("id, email, name");

//   if (error) throw new Error("Failed to fetch users: " + error.message);

//   // log alert in DB
//   const { data: savedAlert, error: saveError } = await supabase
//     .from("sent_alerts")
//     .insert([
//       {
//         atm_id,
//         severity,
//         reason,
//         sent_to: users.map((u) => ({
//           id: u.id,
//           name: u.name,
//           email: u.email,
//         })),
//       },
//     ])
//     .select();

//   if (saveError) throw new Error("Failed to save alert: " + saveError.message);

//   // send notifications
//   for (const user of users) {
//     if (user.email) {
//       const subject = `🚨 [${severity}] ATM Alert: ${atm_id}`;
//       const message = `ATM: ${atm_id}\nRisk Score: ${risk_score}\nCluster: ${cluster_id}\nReason: ${reason}\n\nPlease verify immediately.`;
//       await sendEmail(user.email, subject, message);
//     }

//     // future: enable SMS notifications
//     // if (user.phone) {
//     //   await sendSMS(user.phone, `ATM Alert - ${atm_id} (${severity})`);
//     // }
//   }

//   res.status(200).json({
//     success: true,
//     message: `Alert logged and sent to ${users.length} registered users.`,
//     savedAlert,
//   });
// });



import nodemailer from "nodemailer";
import { supabase } from "../utils/supabaseClient.js";
import { asyncHandler } from "../utils/asynchandler.js";

// helper: send email
export const sendEmail = async (to, subject, message) => {
  const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525, // recommended
    secure: false, // use TLS via STARTTLS, not SSL
    auth: {
      user: process.env.ALERT_EMAIL_USER, // usually apismtp@mailtrap.io
      pass: process.env.ALERT_EMAIL_PASS, // your Mailtrap API token
    },
  });

  const info = await transporter.sendMail({
    from: `"NCPIRF Alerts" <no-reply@ncpirf.in>`, // use demo domain for sandbox
    to,
    subject,
    text: message,
  });

  console.log("✅ Email sent:", info.messageId);
  console.log("📬 Check your Mailtrap Inbox for this email.");
};
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
 

// Main controller
export const sendAlert = asyncHandler(async (req, res) => {
  const { atm_id, risk_score, cluster_id, severity, reason } = req.body;

  if (!atm_id || !severity) {
    return res.status(400).json({ success: false, message: "Missing ATM ID or severity" });
  }

  // fetch all registered users from auth schema using admin methods
  const { data, error: usersError } = await supabase.auth.admin.listUsers();

if (usersError) throw new Error("Failed to fetch users: " + usersError.message);

const users = data.users.map(u => ({
  id: u.id,
  email: u.email,
  name: u.user_metadata?.name || "Unknown",
}));


  if (!users.length) {
    return res.status(404).json({ success: false, message: "No registered users found" });
  }

  // log alert in public.sent_alerts
  const { data: savedAlert, error: saveError } = await supabase
    .from("sent_alerts")
    .insert([
      {
        atm_id,
        severity,
        reason,
        sent_to: users.map(u => ({ id: u.id, name: u.name, email: u.email })),
      },
    ])
    .select();

  if (saveError) throw new Error("Failed to save alert: " + saveError.message);

  // send notifications in parallel
//   await Promise.all(
//     users
//       .filter(u => u.email)
//       .map(u => {
//         const subject = `🚨 [${severity}] ATM Alert: ${atm_id}`;
//         const message = `ATM: ${atm_id}\nRisk Score: ${risk_score}\nCluster: ${cluster_id}\nReason: ${reason}\n\nPlease verify immediately.`;
//         return sendEmail(u.email, subject, message);
//       })
//   );
  for (const user of users.filter(u => u.email)) {
  const subject = `🚨 [${severity}] ATM Alert: ${atm_id}`;
  const message = `ATM: ${atm_id}\nRisk Score: ${risk_score}\nCluster: ${cluster_id}\nReason: ${reason}\n\nPlease verify immediately.`;
  await sendEmail(user.email, subject, message);
    await delay(100); 
}


  res.status(200).json({
    success: true,
    message: `Alert logged and sent to ${users.length} registered users.`,
    savedAlert,
  });
});

