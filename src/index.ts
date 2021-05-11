import Fastify from "fastify";
import mercurius, { IResolvers, MercuriusContext } from "mercurius";
import fs from "fs";
import { PrismaClient, Tweet, User } from ".prisma/client";
import { Prisma } from "@prisma/client";

const PORT = process.env.PORT || 3000;
const app = Fastify();

const prisma = new PrismaClient({ log: ["query"] });

const schema = fs.readFileSync(`${__dirname}/schema.graphql`, "utf-8");

interface Prisma {
  db: PrismaClient<
    Prisma.PrismaClientOptions,
    never,
    Prisma.RejectOnNotFound | Prisma.RejectPerOperation
  >;
}

const resolvers: IResolvers<any, Prisma & MercuriusContext> = {
  Query: {
    user(_parent, args, { db }): Promise<User> {
      return db.user.findUnique({ where: { id: args.id } });
    },
  },
  Mutation: {
    createUser(_parent, args, { db }): Promise<User> {
      return db.user.create({
        data: {
          name: args.name,
          email: args.email,
        },
      });
    },
    createTweet(_p, args, { db }): Promise<Tweet> {
      return db.tweet.create({
        data: {
          userId: args.userId,
          content: args.content,
          published: args.published,
        },
      });
    },
  },
  User: {
    tweets(parent, _, { db }): Promise<Tweet[]> {
      return db.user.findUnique({ where: { id: parent.id } }).tweets();
    },
  },
  Tweet: {
    user(parent, _, { db }): Promise<User> {
      return db.tweet.findUnique({ where: { userId: parent.userId } }).user();
    },
  },
};

app.register(mercurius, {
  schema,
  resolvers,
  graphiql: "playground",
  context: (): Prisma => {
    return { db: prisma };
  },
});

app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}/playground`)
);
