import nodemailer from 'nodemailer';
import env from '../config/env.js';

let transporter;

export const isMailConfigured = () => Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  }
  return transporter;
};

export const sendMail = ({ to, subject, text, html }) =>
  getTransporter().sendMail({ from: env.smtp.from, to, subject, text, html });
