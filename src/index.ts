import Fastify from "fastify";
import mercurius, { IResolvers, MercuriusContext } from "mercurius";
import fs from "fs";
import { PrismaClient, User } from ".prisma/client";
import { Prisma } from "@prisma/client";

const PORT = process.env.PORT || 3000;
const app = Fastify();

const prisma = new PrismaClient();

const schema = fs.readFileSync(`${__dirname}/schema.graphql`, "utf-8");

interface Prisma {
  prisma: PrismaClient<
    Prisma.PrismaClientOptions,
    never,
    Prisma.RejectOnNotFound | Prisma.RejectPerOperation
  >;
}

const resolvers: IResolvers<any, Prisma & MercuriusContext> = {
  Query: {
    users(_parent, _args, { prisma }) {
      return prisma.user.findMany();
    },
  },
  Mutation: {
    async createUser(_parent, args, { prisma }): Promise<User> {
      return prisma.user.create({
        data: {
          name: args.name,
          email: args.email,
        },
      });
    },
  },
};

app.register(mercurius, {
  schema,
  resolvers,
  graphiql: "playground",
  context: (req, reply): Prisma => {
    return { prisma };
  },
});

app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}/playground`)
);
