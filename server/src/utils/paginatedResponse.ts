import { ClassType, Field, ObjectType } from "type-graphql";

export default function PaginatedResponse<T>(TItem: ClassType<T>) {
  @ObjectType({ isAbstract: true })
  abstract class PaginatedResponseClass {
    @Field(() => [TItem])
    items: T[];

    @Field()
    hasMore: boolean;
  }

  return PaginatedResponseClass;
}
