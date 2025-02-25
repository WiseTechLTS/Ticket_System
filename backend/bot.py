import discord
from discord.ext import commands

# Define the bot and enable intents
intents = discord.Intents.default()
intents.messages = True
intents.guilds = True

bot = commands.Bot(command_prefix="!", intents=intents)  # Prefix for bot commands

# Bot startup message
@bot.event
async def on_ready():
    print(f"✅ Logged in as {bot.user.name}")

# Command to check if the bot is working
@bot.command()
async def ping(ctx):
    await ctx.send("🏓 Pong! Bot is active.")

# Command to repeat user input
@bot.command()
async def say(ctx, *, message: str):
    await ctx.send(message)

# Command to provide server info
@bot.command()
async def serverinfo(ctx):
    guild = ctx.guild
    embed = discord.Embed(title=f"Server Info: {guild.name}", color=discord.Color.blue())
    embed.add_field(name="🆔 Server ID", value=guild.id, inline=False)
    embed.add_field(name="👥 Members", value=guild.member_count, inline=False)
    embed.add_field(name="📅 Created On", value=guild.created_at.strftime("%Y-%m-%d"), inline=False)
    await ctx.send(embed=embed)

# Error handler
@bot.event
async def on_command_error(ctx, error):
    if isinstance(error, commands.CommandNotFound):
        await ctx.send("❌ Unknown command. Use `!help` for available commands.")

# Run the bot
TOKEN = "MTM0MTk4ODQ0NjUyNDQxMTkwNA.GGzMFs.4v7DJyIpAEfjqCnnSMX3I0iAU902x_7Kgo5EVY"  # Replace with your bot's token
bot.run(TOKEN)
