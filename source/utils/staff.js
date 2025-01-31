// Copyright 2025 Nether Host

const { EmbedBuilder } = require("discord.js");
const fs = require("fs");
const JSON5 = require("json5");
const User = require("../models/User.js");
const handleError = require("./handle-error.js");

const config = JSON5.parse(
  fs.readFileSync("source/config/general.json5", "utf-8")
);

let staff = {};
staff = JSON5.parse(fs.readFileSync("source/config/staff.json5", "utf-8"));

function isStaff(userId) {
  return staff.ids.includes(String(userId));
}

async function getStaffTicketStatistics(user) {
  try {
    const userData = await User.findOne({ "user.id": user.id });

    if (!userData) {
      return null;
    }

    if (userData.staff.isStaff) {
      return userData;
    }
  } catch (error) {
    handleError(error);
  }
}

async function updateStaffTicketMessages(user, messageCount) {
  try {
    const staffData = await getStaffTicketStatistics(user);

    if (!staffData) {
      return null;
    }

    staffData.staff.ticketMessages += messageCount;
    await staffData.save();

    return staffData;
  } catch (error) {
    handleError(error);
  }
}

async function updateStaffClosedTickets(user) {
  try {
    const staffData = await getStaffTicketStatistics(user);

    if (!staffData) {
      return null;
    }

    staffData.staff.ticketsClosed += 1;
    await staffData.save();

    return staffData;
  } catch (error) {
    handleError(error);
  }
}

async function createStaffStatisticsLeaderboard() {
  try {
    const staffStatistics = await User.find({
      "staff.isStaff": true,
    })
      .select("user staff.ticketMessages staff.ticketsClosed")
      .lean();

    console.log(staffStatistics);

    const sortedStatistics = staffStatistics.sort(
      (a, b) => (b.staff.ticketMessages || 0) - (a.staff.ticketMessages || 0)
    );

    const topFiveStatistics = sortedStatistics.slice(0, 5);

    return topFiveStatistics;
  } catch (error) {
    handleError(error);
  }
}

function buildLeaderboard(staffStatistics, messages, client) {
  const embed = new EmbedBuilder()
    .setTitle(messages.staffStatsLeaderboardTitle)
    .setDescription(messages.staffStatsLeaderboardDescription)
    .setColor(config.general.botColor)
    .setFooter({
      text: "Nether Host | nether.host",
      iconURL: client.user.displayAvatarURL({ dynamic: true }),
    });

  staffStatistics.forEach((staff, index) => {
    embed.addFields({
      name: `#${index + 1} | ${staff.user.username}`,
      value: `${messages.staffStatsLeaderboardFields.messages}: ${
        staff.staff.ticketMessages || "N/A"
      }\n${messages.staffStatsLeaderboardFields.closed}: ${
        staff.staff.ticketsClosed || "N/A"
      }`,
    });
  });

  return embed;
}

async function addUserToStaff(user) {
  try {
    const userData = await User.findOne({ "user.id": user.id });

    if (!userData) {
      return "User not found.";
    }

    if (userData.staff.isStaff) {
      return "That user is already a staff member.";
    }

    userData.staff.isStaff = true;
    await userData.save();

    const staffList = staff.ids;
    staffList.push(user.id);
    staff.ids = staffList;
    fs.writeFileSync(
      "source/config/staff.json5",
      JSON.stringify(staff, null, 2)
    );

    return "Successfully added user to staff.";
  } catch (error) {
    handleError(error);
    return "Failed to add user to staff. Check the console for more information.";
  }
}

async function removeUserFromStaff(user) {
  try {
    const userData = await User.findOne({ "user.id": user.id });

    if (!userData) {
      return "User not found.";
    }

    if (!userData.staff.isStaff) {
      return "That user is not a staff member.";
    }

    userData.staff.isStaff = false;
    await userData.save();

    const staffList = staff.ids;
    staffList.splice(staffList.indexOf(user.id), 1);
    staff.ids = staffList;
    fs.writeFileSync(
      "source/config/staff.json5",
      JSON.stringify(staff, null, 2)
    );

    return "Successfully removed user from staff.";
  } catch (error) {
    handleError(error);
    return "Failed to add user to staff. Check the console for more information.";
  }
}

module.exports = {
  isStaff,
  getStaffTicketStatistics,
  updateStaffTicketMessages,
  updateStaffClosedTickets,
  createStaffStatisticsLeaderboard,
  buildLeaderboard,
  addUserToStaff,
  removeUserFromStaff,
};
