import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { api } from "~/utils/api";
import { useWidth } from "~/hooks/useWidth";
import { CLAY_CLASS_RESOURCES } from "~/utils/constants";

type ClassItem = {
  Stego: number;
  Total: number;
  Trice: number;
  Bronto: number;
};

function getBgColor(species: string) {
  switch (species) {
    case "Stego":
      return "bg-red-400";
    case "Trice":
      return "bg-blue-400";
    case "Bronto":
      return "bg-amber-400";
    case "Ankylo":
      return "bg-purple-400";
    case "Rex":
      return "bg-green-500";
    case "Raptor":
      return "bg-pink-400";
  }
}

function calculateWidth(elementWidth: number, count: number, total: number) {
  const containerOffset =
    elementWidth > 768 ? elementWidth * 0.95 : elementWidth;
  return `${(count / total) * containerOffset}px`;
}

export const ClassCounter = () => {
  const speciesBarRef = useRef<HTMLDivElement>(null);
  const containerWidth = useRef<HTMLDivElement>(null);
  const [topClass, setTopClass] = useState(0);
  const {
    data,
    // isLoading,
    // refetch,
  } = api.stats.getClassCountSnapshot.useQuery();

  const { elementWidth: classElementWidth } = useWidth(containerWidth);

  useEffect(() => {
    const largestTotal = findLargestTotal(data?.classes);
    setTopClass(largestTotal);
  }, [data]);

  const [isWiggling, setIsWiggling] = useState(null);

  return (
    <div className="flex w-full flex-col gap-2">
      <h1 className="p-4 text-center font-clayno text-3xl hover:animate-wiggle md:text-5xl">
        <span className="text-green-500">Cl</span>
        <span className="text-blue-400">as</span>
        <span className="text-red-400">ses</span>
      </h1>
      <div
        className="flex w-full flex-col items-center gap-8 md:container"
        ref={containerWidth}
      >
        {data &&
          (data.classes as Array<{ [key: string]: ClassItem }>)
            ?.sort((a, b) => {
              const keyA = Object.keys(a)[0];
              const keyB = Object.keys(b)[0];
              if (keyA && keyB) {
                const totalA = a[keyA]?.Total || 0;
                const totalB = b[keyB]?.Total || 0;
                return totalB - totalA;
              }
              return 0;
            })
            .map((classItem: { [key: string]: ClassItem }) => {
              const classType = Object.keys(classItem)[0] ?? "warrior";
              const speciesList = Object.values(classItem)[0];
              const total = speciesList?.Total as number;

              const speciesEntries = Object.entries(
                speciesList as { [key: string]: number }
              ).filter(([key]) => key !== "Total");

              return (
                <div
                  key={classType}
                  className="flex min-w-[60%] flex-row items-center self-start"
                  style={{
                    width: calculateWidth(
                      classElementWidth ?? 0,
                      speciesList?.Total as number,
                      topClass
                    ),
                  }}
                >
                  <div
                    className={`flex w-full flex-row items-center justify-center`}
                  >
                    <div
                      className="flex w-full flex-row overflow-hidden rounded-l-3xl"
                      ref={speciesBarRef}
                    >
                      {speciesEntries
                        .sort((a, b) => b[1] - a[1])
                        .map((species) => {
                          return (
                            <div
                              key={species[0]}
                              className={`flex min-w-fit cursor-pointer flex-row items-center justify-center px-2 font-clayno hover:animate-pulse md:gap-1 md:px-4  ${getBgColor(
                                species[0]
                              )}`}
                              style={{
                                width: `${
                                  speciesList
                                    ? (species[1] / total) * 100
                                    : `33.33333`
                                }%`,
                              }}
                            >
                              <p className="md:text-md text-sm">{species[1]}</p>
                              <div
                                className={`relative h-[35px] w-[35px] hover:animate-wiggle md:h-[50px] md:w-[50px] `}
                              >
                                <Image
                                  src={`/icons/${species[0].toLowerCase()}_colored.svg`}
                                  fill
                                  alt={`${species[0]} Icon`}
                                />
                              </div>
                              <p className="hidden md:block">{species[0]}</p>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                  <div className="relative flex h-[35px] flex-row items-center gap-2 rounded-r-full bg-gray-300 md:h-[50px]">
                    <p className="flex flex-row flex-nowrap gap-2 whitespace-nowrap px-4 text-right font-clayno text-black">
                      <span>{total}</span>
                      <span className="hidden md:block">{classType}s</span>
                    </p>
                    <div className="relative h-[55px] w-[55px] md:h-[75px] md:w-[75px]">
                      <Image
                        src={`/images/${classType?.toLowerCase()}.png`}
                        fill
                        alt={`Class ${classType} Placeholder`}
                      />
                      <div className="relative flex cursor-pointer items-center justify-center opacity-0 hover:opacity-100">
                        <div className="relative h-[55px] w-[55px] animate-spin-slow md:h-[75px] md:w-[75px]">
                          <div className="absolute -top-8 left-3 h-[30px] w-[30px] md:-top-14 md:left-5 md:h-[50px] md:w-[50px]">
                            <Image
                              src={`/images/${
                                CLAY_CLASS_RESOURCES[
                                  classType?.toLowerCase()
                                ]?.[0]
                              }.png`}
                              alt={`Clay`}
                              fill
                              className="rounded-full"
                            />
                          </div>
                          <div className="absolute right-14 top-3 h-[30px] w-[30px] md:left-20 md:top-3 md:h-[50px] md:w-[50px]">
                            <Image
                              src={`/images/${
                                CLAY_CLASS_RESOURCES[
                                  classType?.toLowerCase()
                                ]?.[1]
                              }.png`}
                              alt={`Clay`}
                              fill
                              className="rounded-full"
                            />
                          </div>
                          <div className="absolute left-3 top-14 h-[30px] w-[30px] md:left-5 md:top-20 md:h-[50px] md:w-[50px]">
                            <Image
                              src={`/images/${
                                CLAY_CLASS_RESOURCES[
                                  classType?.toLowerCase()
                                ]?.[2]
                              }.png`}
                              alt={`Clay`}
                              fill
                              className="rounded-full"
                            />
                          </div>
                        </div>
                        <h1 className="absolute right-0 top-4 animate-none rounded-lg bg-black p-1 font-clayno text-xs md:hidden">
                          {classType}
                        </h1>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
};

function findLargestTotal(data: any) {
  let largestTotal = 0;

  data &&
    data.forEach((classObj: any) => {
      // Assuming each object has only one key
      const classKey = Object.keys(classObj)[0] ?? "";
      const totalValue = classObj[classKey].Total;

      if (totalValue && totalValue > largestTotal) {
        largestTotal = totalValue;
      }
    });

  return largestTotal ?? 0;
}
