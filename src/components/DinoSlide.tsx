import { useUser } from "~/hooks/useUser";
import { api } from "~/utils/api";
import Image from "next/image";
import { HiArrowCircleUp } from "react-icons/hi";
import { Fragment, useEffect, useMemo, useState } from "react";
import ToggleSwitch from "./ToggleSwitch";
import { Dino } from "@prisma/client";
import { ScrollArea } from "~/@/components/ui/scroll-area";
import { HiChevronDown, HiChevronUp, HiViewGridAdd } from "react-icons/hi";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/@/components/ui/tooltip";
import LoginModal from "./LoginModal";

type DinoSlideProps = {
  handlePlace: (imageURL: string, motion: string, mint: string) => void;
  handleDragStart: (
    e: React.DragEvent<HTMLImageElement>,
    imageURL: string,
    motion: string,
    mint: string
  ) => void;
  handleFillCells: (dinos: any, showPFP: boolean) => void;
};

const CLAYNO_LOGO = {
  mint: "clayno_logo_vertical_1024x1024",
  species: "",
  skin: "",
  color: "",
  motion: "PFP",
  gif: "/images/clayno_logo_vertical_1024x1024.png",
  holderOwner: "Claynosaurz",
  name: "Claynosaurz",
  pfp: "/images/clayno_logo_vertical_1024x1024.png",
  rarity: 0,
  subDAOId: null,
};

export default function DinoSlide({
  handlePlace,
  handleDragStart,
  handleFillCells,
}: DinoSlideProps) {
  const { user, session } = useUser();
  const [showPFP, setShowPFP] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const wallets = user?.wallets.map((wallet: any) => wallet.address) ?? [];

  const { data: holders, isLoading } = api.fusion.getUserDinos.useQuery({
    wallets: wallets,
  });

  const holdersWithDefaults = holders && [...holders, { mints: [CLAYNO_LOGO] }];

  const togglePFP = (newToggleState: boolean) => {
    setShowPFP(newToggleState);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const extractedMints: any = holders
    ?.flatMap((holder) => holder.mints)
    .filter((dino) => dino.attributes !== null);

  return (
    <div className={`fixed bottom-0 left-0 select-none px-2 transition-all`}>
      <div
        className="flex w-full cursor-pointer justify-center"
        onClick={toggleMinimize}
      >
        {isMinimized ? (
          <HiChevronUp color="white" size={32} />
        ) : (
          <HiChevronDown color="white" size={32} />
        )}
      </div>
      <ScrollArea
        className={`w-full rounded-md border bg-black ${
          isMinimized ? "h-[50px]" : "h-[240px]"
        }`}
      >
        <div className="flex p-4">
          {user && session ? (
            <div className="flex flex-row">
              <div className="flex flex-row flex-wrap gap-2">
                {holdersWithDefaults?.map((holder, index) => (
                  <Fragment key={index}>
                    {holder.mints.map((dino: any) => (
                      <div
                        key={dino.mint}
                        className="relative flex h-28 w-28 cursor-grab justify-center overflow-clip rounded-md lg:h-36 lg:w-36"
                      >
                        <Image
                          className="transform-gpu transition-transform hover:scale-125"
                          src={
                            dino.mint !== "clayno_logo_vertical_1024x1024"
                              ? `https://prod-image-cdn.tensor.trade/images/slug=claynosaurz/400x400/freeze=false/${
                                  showPFP ? dino.pfp : dino.gif
                                }`
                              : dino.pfp
                          }
                          alt=""
                          fill
                          quality={75}
                          onDragStart={(e) =>
                            handleDragStart(
                              e,
                              e.currentTarget.src,
                              dino.attributes?.motion || "",
                              dino.mint
                            )
                          }
                        />
                        <div
                          onClick={() =>
                            handlePlace(
                              showPFP ? dino.pfp : dino.gif,
                              showPFP
                                ? "PFP"
                                : dino.attributes?.motion || "PFP",
                              dino.mint
                            )
                          }
                          className="flex transform cursor-pointer items-center justify-center opacity-0 transition-opacity hover:opacity-100"
                        >
                          <HiArrowCircleUp size={50} />
                        </div>
                      </div>
                    ))}
                  </Fragment>
                ))}
              </div>
              <div className="flex flex-col justify-start gap-3 lg:px-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <ToggleSwitch
                        className="self-end"
                        toggleState={showPFP}
                        label={"PFP"}
                        onToggle={togglePFP}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Toggle PFPs</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger
                      className="self-end rounded-lg bg-fuchsia-500 px-2 py-1 hover:bg-fuchsia-400"
                      onClick={() => handleFillCells(extractedMints, showPFP)}
                    >
                      <HiViewGridAdd size={24} />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Fill Cells</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          ) : (
            <div className="w-full">
              <LoginModal />
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
