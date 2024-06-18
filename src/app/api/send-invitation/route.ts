import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const user = process.env.EMAIL;
const pass = process.env.PASSWORD;

export async function POST(request: Request) {
  if (request.method !== "POST") {
    return NextResponse.json(
      { message: "Method not allowed" },
      { status: 405 }
    );
  }
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { email, teamId } = body;

  const userCount = await db.memberships.count({
    where: {
      team_id: teamId,
    },
  });

  if (userCount >= 5) {
    return NextResponse.json(
      { message: "Max number of users in a single team is reached" },
      { status: 401 }
    );
  }

  try {
    const team = await db.teams.findUnique({
      where: {
        id: teamId,
      },
    });
    const receiverUser = await db.users.findUnique({
      where: {
        email: email,
      },
    });
    const senderUser = await db.users.findUnique({
      where: {
        email: session.user.email,
      },
    });

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user,
        pass,
      },
    });
    const mailOptions = {
      from: "Punarv Dinakar",
      to: receiverUser?.email,
      subject: `Invitation to join team ${team?.name} in AeosGPT`,
      text: `Hello ${receiverUser?.name}, you have been invited to join team ${
        team?.name
      } by ${
        senderUser?.name
      }. You can accept the invitation by clicking on this link:  https://aeos-gpt.vercel.app/accept-invitation/${
        team?.token
      }?userId=${encodeURIComponent(receiverUser!.id)}`,
    };
    await transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email: ", error);
      } else {
        console.log("Email sent: ", info.response);
      }
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}