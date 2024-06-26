const NotificationProvider = require("./notification-provider");
const axios = require("axios");
const { DOWN, UP } = require("../../src/util");

class Discord extends NotificationProvider {
    name = "discord";

    /**
     * @inheritdoc
     */
    async send(notification, msg, monitorJSON = null, heartbeatJSON = null) {
        const okMsg = "Sent Successfully.";

        try {
            const discordDisplayName = notification.discordUsername || "Uptime Kuma";
            const webhookUrl = new URL(notification.discordWebhookUrl);
            if (notification.discordChannelType === "postToThread") {
                webhookUrl.searchParams.append("thread_id", notification.threadId);
            }

            // If heartbeatJSON is null, assume we're testing.
            if (heartbeatJSON == null) {
                let discordtestdata = {
                    username: discordDisplayName,
                    content: msg,
                };

                if (notification.discordChannelType === "createNewForumPost") {
                    discordtestdata.thread_name = notification.postName;
                }

                await axios.post(webhookUrl.toString(), discordtestdata);
                return okMsg;
            }

            // If heartbeatJSON is not null, we go into the normal alerting loop.
            const unix = Math.floor(new Date(heartbeatJSON["localDateTime"]).getTime() / 1000);
            if (heartbeatJSON["status"] === DOWN) {
                let discorddowndata = {
                    username: discordDisplayName,
                    embeds: [{
                        title: "Service Alert",
                        color: 0xff4d4f,
                        timestamp: heartbeatJSON["time"],
                        description: `A service alert was sent for **${monitorJSON["name"]}** for being offline. Please check the service and ensure that there is no system-wide outage.`,
                        fields: [
                            {
                                name: "Service",
                                value: `[${monitorJSON["name"]}](${address})`,
                                inline: true,
                            },
                            {
                                name: `Time (${heartbeatJSON["timezone"]})`,
                                value: `<t:${unix}>`,
                                inline: true,
                            },
                            {
                                name: "Error",
                                value: heartbeatJSON["msg"] == null ? "N/A" : `\`\`\`${heartbeatJSON["msg"]}\`\`\``,
                                inline: false,
                            },
                        ],
                    }],
                };
                if (notification.discordChannelType === "createNewForumPost") {
                    discorddowndata.thread_name = notification.postName;
                }
                if (notification.discordPrefixMessage) {
                    discorddowndata.content = notification.discordPrefixMessage;
                }

                await axios.post(webhookUrl.toString(), discorddowndata);
                return okMsg;

            } else if (heartbeatJSON["status"] === UP) {
                let discordupdata = {
                    username: discordDisplayName,
                    embeds: [{
                        title: "Service Alert",
                        color: 0x30c23f,
                        timestamp: heartbeatJSON["time"],
                        description: `Received connection from **${monitorJSON["name"]}** sucessfully. Service is back online!`,
                        fields: [
                            {
                                name: "Service",
                                value: `[${monitorJSON["name"]}](${address})`,
                                inline: true,
                            },
                            {
                                name: `Time (${heartbeatJSON["timezone"]})`,
                                value: `<t:${unix}>`,
                                inline: true,
                            },
                            {
                                name: "Ping",
                                value: heartbeatJSON["ping"] == null ? "N/A" : `\`\`\`ml\n${heartbeatJSON["ping"]} ms\`\`\``,
                            },
                        ],
                    }],
                };

                if (notification.discordChannelType === "createNewForumPost") {
                    discordupdata.thread_name = notification.postName;
                }

                if (notification.discordPrefixMessage) {
                    discordupdata.content = notification.discordPrefixMessage;
                }

                await axios.post(webhookUrl.toString(), discordupdata);
                return okMsg;
            }
        } catch (error) {
            this.throwGeneralAxiosError(error);
        }
    }

}

module.exports = Discord;
