import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { api } from "~/utils/api";
import TabSelection from "~/components/TabSelection";
import Herd from "~/components/Herd";
import Image from "next/image";
import Link from "next/link";
import { useTimeSinceLastUpdate } from "~/hooks/useUpdated";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Herd as HerdType,
  Attributes,
  Dino,
  Voter,
  User,
  Discord,
  Twitter,
  Wallet,
} from "@prisma/client";
import { useUser } from "~/hooks/useUser";
import { useToast } from "~/@/components/ui/use-toast";
import { VoteWidget } from "~/components/VoteWidget";
import { HiExternalLink, HiX, HiRefresh } from "react-icons/hi";
import { FilterDialog } from "~/components/FilterDialog";
// const getHerdRarity = (herd: any) => {
//   const total = herd.herd.reduce((sum: number, obj: any) => {
//     if (obj.attributes.species !== "Dactyl") {
//       if (obj.rarity) {
//         return sum + obj.rarity;
//       }
//     }
//     return sum;
//   }, 0);

//   return (total / 6).toFixed(0);
// };

type Owners =
  | (User & {
      discord: Discord | null;
      twitter: Twitter | null;
      wallets: Wallet[];
    })[]
  | undefined;

type HerdWithIncludes =
  | HerdType & {
      herd: (Dino & {
        attributes: Attributes | null;
      })[];
      voters: (Voter & {
        user: User & {
          discord: Discord | null;
          twitter: Twitter | null;
        };
      })[];
    };

// Custom hook to filter herds
function useFilteredHerds(
  allHerds: HerdWithIncludes[] | undefined,
  color: string | null,
  skin: string | null,
  background: string | null,
  tier: string | null
) {
  return allHerds?.filter((herd) => {
    const herdMatchesLower = herd.matches.toLowerCase();
    const colorFilter =
      !color || color === "all" || herdMatchesLower.includes(color);
    const skinFilter =
      !skin || skin === "all" || herdMatchesLower.includes(skin);
    const backgroundFilter =
      !background ||
      background === "all" ||
      herdMatchesLower.includes(background);
    const tierValue =
      tier === "perfect" ? 1 : tier === "epic" ? 2 : tier === "rare" ? 3 : 0;
    const tierFilter = !tier || tier === "all" || herd.tier === tierValue;

    return colorFilter && skinFilter && backgroundFilter && tierFilter;
  });
}

function useHerdOwners(walletAddresses: string[]) {
  const allHerdOwnersQuery = api.binding.getUsersByWalletAddresses.useQuery({
    walletAddresses,
  });
  const { data, isError, isLoading } = allHerdOwnersQuery;
  return { data, isError, isLoading };
}

export default function Home() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const { user, voterInfo, session, sessionStatus } = useUser();
  const { data: allHerds, isLoading: allHerdsLoading } =
    api.herd.getAllHerds.useQuery();
  const [castVoteLoading, setCastVoteLoading] = useState(false);
  const [removeVoteLoading, setRemoveVoteLoading] = useState(false);
  const utils = api.useContext();

  const castVote = api.vote.castVote.useMutation({
    async onMutate(updateVoterInfo) {
      await utils.vote.getVoterInfo.cancel();

      const prevData = utils.vote.getVoterInfo.getData({
        userId: updateVoterInfo.userId,
      });

      if (user && prevData) {
        const newData = {
          ...prevData,
          votes: [
            ...prevData.votes,
            { id: updateVoterInfo.herdId } as HerdType,
          ],
          votesAvailable: prevData.votesAvailable - 1,
          votesCast: prevData.votesCast + 1,
        };

        utils.vote.getVoterInfo.setData(
          { userId: updateVoterInfo.userId },
          newData
        );
      }

      return { prevData };
    },
    onError(err, updatedVoterInfo, ctx) {
      if (user) {
        utils.vote.getVoterInfo.setData({ userId: user.id }, ctx?.prevData);
      }
    },
    onSettled() {
      // Sync with server once mutation has settled
      utils.vote.getVoterInfo.invalidate();
      utils.herd.getAllHerds.invalidate();
      setTimeout(() => {
        setCastVoteLoading(false);
      }, 2000);
    },
  });

  const removeVote = api.vote.removeVote.useMutation({
    async onMutate(updateVoterInfo) {
      await utils.vote.getVoterInfo.cancel();

      const prevData = utils.vote.getVoterInfo.getData({
        userId: updateVoterInfo.userId,
      });

      if (user && prevData) {
        const newData = {
          ...prevData,
          votes: [
            ...prevData.votes,
            { id: updateVoterInfo.herdId } as HerdType,
          ],
          votesAvailable: prevData.votesAvailable + 1,
          votesCast: prevData.votesCast - 1,
        };

        utils.vote.getVoterInfo.setData(
          { userId: updateVoterInfo.userId },
          newData
        );
      }

      return { prevData };
    },
    onError(err, updatedVoterInfo, ctx) {
      // If the mutation fails, use the context-value from onMutate
      if (user) {
        utils.vote.getVoterInfo.setData({ userId: user.id }, ctx?.prevData);
      }
    },
    onSettled() {
      // Sync with server once mutation has settled
      utils.vote.getVoterInfo.invalidate();
      utils.herd.getAllHerds.invalidate();
      setTimeout(() => {
        setRemoveVoteLoading(false);
      }, 2000);
    },
  });

  const color = searchParams.get("color") || "all";
  const skin = searchParams.get("skin") || "all";
  const background = searchParams.get("background") || "all";
  const tier = searchParams.get("tier") || "all";

  const [showDactyl, setShowDactyl] = useState(false);
  const [showSaga, setShowSaga] = useState(false);
  const [showPFP, setShowPFP] = useState(false);
  const [showVoted, setShowVoted] = useState(false);

  const myVotes = allHerds?.filter((herd) =>
    herd.voters.some((voter) => voter.userId === user?.id)
  );

  const [filteredHerds, setFilteredHerds] = useState<
    HerdWithIncludes[] | undefined
  >(useFilteredHerds(allHerds, color, skin, background, tier));

  const allHerdAddressesSet = new Set(allHerds?.map((herd) => herd.owner));
  const allHerdAddresses = [...allHerdAddressesSet];

  const { data: owners } = useHerdOwners(allHerdAddresses);

  useEffect(() => {
    setFilteredHerds(allHerds);
  }, []);

  useEffect(() => {
    if (allHerds && !allHerdsLoading) {
      // Calculate and set the filteredHerds based on the latest allHerds data
      setFilteredHerds(
        useFilteredHerds(allHerds, color, skin, background, tier)
      );
    }
  }, [color, background, skin, tier, allHerds]);

  const toggleDactyl = (newToggleState: boolean) => {
    setShowDactyl(newToggleState);
  };

  const toggleSaga = (newToggleState: boolean) => {
    setShowSaga(newToggleState);
  };

  const togglePFP = (newToggleState: boolean) => {
    setShowPFP(newToggleState);
  };

  const toggleVoted = (newToggleState: boolean) => {
    setShowVoted(newToggleState);
    if (newToggleState) {
      setFilteredHerds(myVotes);
    } else {
      setFilteredHerds(
        useFilteredHerds(allHerds, color, skin, background, tier)
      );
    }
  };

  const handleCastVote = (herdId: string) => {
    if (castVoteLoading || removeVoteLoading) {
      return;
    }

    if (sessionStatus === "unauthenticated") {
      toast({
        title: "Sign in first!",
      });
      return;
    }

    if (!voterInfo) {
      toast({
        title: "Not eligible to vote 😔",
      });
      return;
    }

    if (voterInfo && voterInfo.votesAvailable <= 0) {
      toast({
        title: "No votes remaining!",
      });
      return;
    }

    if (voterInfo?.votesAvailable === null) {
      toast({
        title: "Could not retrieve voter status",
        description: "Please try again",
        variant: "destructive",
      });
      return;
    }

    if (!user?.discord && !user?.twitter) {
      toast({
        title: "Please connect a social account before voting",
        description: (
          <div className="rounded-md bg-black px-3 py-2">
            <a
              href={`/profile/${user?.defaultAddress}/settings`}
              className="flex flex-row items-center gap-2 "
            >
              <span className="text-white">Settings</span>
              <HiExternalLink size={24} />
            </a>
          </div>
        ),
        variant: "destructive",
      });
      return;
    }

    const alreadyVoted =
      filteredHerds &&
      filteredHerds.some(
        (herd) =>
          herd.id === herdId &&
          herd.voters.some((voter) => voter.userId === user?.id)
      );

    if (alreadyVoted) {
      toast({
        title: "You already voted for this herd!",
      });
      return;
    }
    if (user) {
      try {
        setCastVoteLoading(true);
        castVote.mutate({ userId: user.id, herdId });
        // toast({
        //   title: "Vote cast!",
        // });
      } catch (error) {
        console.error("Error casting vote:", error);
        toast({
          title: "An error occurred while casting your vote.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Must be signed in to vote!",
        variant: "destructive",
      });
    }
  };

  const handleRemoveVote = (herdId: string) => {
    if (castVoteLoading || removeVoteLoading) {
      return;
    }

    if (voterInfo?.votesAvailable === null) {
      toast({
        title: "Could not retrieve voter status",
        description: "Please try again",
        variant: "destructive",
      });
      return;
    }

    if (user) {
      try {
        setRemoveVoteLoading(true);
        removeVote.mutateAsync({ userId: user.id, herdId });
        // toast({
        //   title: "Vote removed!",
        // });
      } catch (error) {
        console.error("Error removing vote:", error);
        toast({
          title: "An error occurred while removing your vote.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Must be signed in to vote!",
        variant: "destructive",
      });
    }
  };

  // const herds = api.useQueries((t) =>
  //   [1, 2, 3].map((tier) => t.herd.getHerdTier({ tier: tier }))
  // );
  // const isLoading = herds.some((queryResult) => queryResult.isLoading);

  const lastUpdated = useTimeSinceLastUpdate("herds");
  const filtersActive = [color, skin, background, tier].filter(
    (filter) => filter !== "all"
  ).length;
  const filteredResults =
    !allHerdsLoading && filteredHerds && filteredHerds?.length > 0
      ? filteredHerds?.length
      : 0;

  return (
    <>
      <Head>
        <title>DinoHerd | Herds</title>
        <meta name="description" content="Claynosaurz Collectors Gallery" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="relative flex min-h-screen flex-col items-center  bg-black">
        {allHerdsLoading ? (
          <div className="relative mb-24 aspect-square w-1/2 overflow-clip rounded-full text-white md:w-1/4">
            <Image
              src="/gifs/TTT.gif"
              alt="Loading"
              fill
              className="rounded-full"
            />
          </div>
        ) : (
          <div className="flex w-full flex-col items-center justify-center py-2 md:px-4">
            {/* <div className="flex w-full flex-col flex-wrap items-center justify-center p-2">
              <div className="relative aspect-video w-full p-4 md:w-1/2">
                <Image
                  className="rounded-lg"
                  src="/images/3d_herd.jpeg"
                  alt="Claynosaurz"
                  quality={100}
                  fill
                />
                <div className="absolute right-0 top-0 hidden h-full w-3/5 items-start justify-end md:flex">
                  <div className="m-4 flex max-w-lg flex-col gap-4 rounded-xl bg-black/70 p-8 text-white hover:bg-black/30">
                    <h2 className="text-xl font-extrabold text-white md:text-2xl">
                      Dino{" "}
                      <span className="text-[hsl(192,100%,70%)]">Herds</span>
                    </h2>
                    <div className="md:text-md text-sm">
                      <p className="pb-2">
                        A herd is a collection containing one of each of the six
                        original Claynosaurz species.
                      </p>
                      <p>The more matching traits the better!</p>
                    </div>
                  </div>
                </div>
                <div className="absolute left-0 top-0 flex h-full w-full items-start justify-end md:hidden">
                  <div className="m-5 flex max-w-lg flex-col rounded-xl bg-black/70 px-4 py-3 text-white hover:bg-black/30">
                    <h2 className="text-xl font-extrabold text-white">
                      Dino{" "}
                      <span className="text-[hsl(280,100%,70%)]">Herds</span>
                    </h2>
                  </div>
                </div>
                <div className="absolute -bottom-5 -right-0 pt-2 text-right text-xs italic text-zinc-500">
                  {`Updated ${lastUpdated}`}
                </div>
              </div>
            </div> */}

            <section className="flex flex-row items-center justify-center gap-4 p-8 text-white">
              <FilterDialog
                color={color}
                skin={skin}
                background={background}
                tier={tier}
              />

              {filtersActive > 0 && (
                <div className="flex flex-row flex-nowrap rounded-md bg-neutral-800 p-2 hover:bg-neutral-700">
                  <Link
                    href={`?skin=all&color=all&background=all&tier=all`}
                    className="flex flex-row flex-nowrap items-center gap-2 text-sm font-bold text-white "
                  >
                    [{filtersActive}]
                    <HiX size={20} className="text-white" />
                  </Link>
                </div>
              )}
              <div className="text-sm font-bold text-white">
                <div>
                  {filteredResults} herd
                  {filteredResults !== 1 && `s`}
                </div>
              </div>
            </section>

            <section className="w-full md:w-4/5 lg:w-2/3 xl:w-3/5 2xl:w-1/2">
              <TabSelection
                labels={["3 Trait", "2 Trait", "1 Trait"]}
                counts={[
                  // herds[0]?.data?.length ?? 0,
                  // herds[1]?.data?.length ?? 0,
                  // herds[2]?.data?.length ?? 0,
                  0, 0, 0,
                ]}
                showDactyl={showDactyl}
                showSaga={showSaga}
                showPFP={showPFP}
                showVoted={showVoted}
                toggleDactyl={toggleDactyl}
                toggleSaga={toggleSaga}
                togglePFP={togglePFP}
                toggleVoted={toggleVoted}
              >
                {/* {herds.map((tier, index) => ( */}
                <div className="flex flex-col items-center justify-center gap-2">
                  {/* {tier.data &&
                      tier.data?.map((herd) => (
                        <Herd
                          key={herd.id}
                          herd={herd}
                          showDactyl={showDactyl}
                          showSaga={showSaga}
                          showOwner={true}
                          showPFP={showPFP}
                        />
                      ))} */}

                  {filteredResults === 0 && (
                    <div className="mt-10 flex flex-col items-center justify-center gap-2">
                      {allHerdsLoading ? (
                        <HiRefresh
                          size={50}
                          className="animate-spin text-white"
                        />
                      ) : (
                        <>
                          <Image
                            src="/images/travolta.gif"
                            width={200}
                            height={200}
                            alt="???"
                            className="rounded-lg"
                          />
                          <p className="font-semibold text-white">
                            No herds found!
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  {filteredHerds?.map((herd) => {
                    const foundUser = owners?.find((user) => {
                      return user.wallets.some(
                        (wallet) => wallet.address === herd.owner
                      );
                    });
                    return (
                      <div
                        key={herd.id}
                        className="flex w-full flex-row items-center gap-8"
                      >
                        <Herd
                          key={herd.id}
                          herd={herd as HerdWithIncludes}
                          showDactyl={showDactyl}
                          showSaga={showSaga}
                          showOwner={true}
                          showPFP={showPFP}
                          owner={foundUser}
                        />
                        <VoteWidget
                          voterInfo={voterInfo}
                          herd={herd}
                          handleRemoveVote={handleRemoveVote}
                          handleCastVote={handleCastVote}
                          voteLoading={castVoteLoading || removeVoteLoading}
                        />
                      </div>
                    );
                  })}
                </div>
                {/* ))} */}
              </TabSelection>
            </section>
          </div>
        )}
      </main>
    </>
  );
}
