"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const discord_js_1 = require("discord.js");
const helpers_1 = require("../lib/helpers");
const prisma_1 = tslib_1.__importDefault(require("../lib/prisma"));
async function pruneThreads(client) {
    try {
        const conversations = await prisma_1.default.conversation.findMany({
            where: {
                expiresAt: {
                    lte: new Date(),
                },
            },
        });
        for (const conversation of conversations) {
            let channel = null;
            try {
                channel = await client.channels.fetch(conversation.channelId);
            }
            catch (err) {
                if (err.code !== 10003) {
                    console.error(err);
                }
            }
            if (channel && channel.isThread()) {
                let message = null;
                try {
                    message = await channel.parent?.messages.fetch(conversation.interactionId);
                }
                catch (err) {
                    if (err.code !== 10008) {
                        console.error(err);
                    }
                }
                if (message && message.embeds.length > 0) {
                    const embed = message.embeds[0];
                    await message.edit({
                        embeds: [
                            new discord_js_1.EmbedBuilder()
                                .setColor(discord_js_1.Colors.Yellow)
                                .setTitle('Conversation deleted due to inactivity')
                                .setDescription(embed.description)
                                .setFields(embed.fields.filter((field) => field.name !== 'Thread')),
                        ],
                    });
                }
                await (0, helpers_1.destroyThread)(channel);
            }
            await prisma_1.default.conversation.delete({
                where: {
                    id: conversation.id,
                },
            });
        }
        if (conversations.length > 0) {
            console.log(`Pruned ${conversations.length} expired conversations.`);
        }
    }
    catch (err) {
        console.error(err);
    }
}
exports.default = pruneThreads;
