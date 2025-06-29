import { useState, useRef, useEffect } from "react";
import { useSectionAppearanceStore } from "@/stores/SectionAppearanceStore";
import { Button } from "@openmarch/ui";
import { Trash, Info, Plus } from "@phosphor-icons/react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@openmarch/ui";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTriggerText,
    SelectGroup,
} from "@openmarch/ui";
import {
    SectionAppearance,
    ModifiedSectionAppearanceArgs,
    NewSectionAppearanceArgs,
} from "@/global/classes/SectionAppearance";
import * as Form from "@radix-ui/react-form";
import * as Tooltip from "@radix-ui/react-tooltip";
import { TooltipContents } from "@openmarch/ui";
import ColorPicker from "../ui/ColorPicker";
import clsx from "clsx";
import { SECTIONS } from "@/global/classes/Sections";
import CanvasMarcher from "@/global/classes/canvasObjects/CanvasMarcher";
import { toast } from "sonner";

const formFieldClassname = clsx("grid grid-cols-12 gap-8 h-[40px] ml-16");
const labelClassname = clsx("text-body text-text/80 self-center col-span-5");
const inputClassname = clsx("col-span-6 self-center");

export default function SectionAppearanceList() {
    const { sectionAppearances, fetchSectionAppearances } =
        useSectionAppearanceStore();
    const [localAppearances, setLocalAppearances] = useState<
        SectionAppearance[]
    >([]);
    const changesRef = useRef<{ [key: number]: any }>({});
    const deletionsRef = useRef<number[]>([]);

    function clearChanges() {
        changesRef.current = {};
        deletionsRef.current = [];
    }

    const defaultFillColor = CanvasMarcher.theme.defaultMarcher.fill;
    const defaultOutlineColor = CanvasMarcher.theme.defaultMarcher.outline;
    const defaultShapeType = "circle";

    const shapeOptions = ["circle", "square", "triangle", "x"];

    useEffect(() => {
        fetchSectionAppearances();
    }, [fetchSectionAppearances]);

    // Reset change tracking when source data changes
    useEffect(() => {
        setLocalAppearances(sectionAppearances);
        clearChanges();
    }, [sectionAppearances]);

    async function handleSubmit() {
        const modifiedAppearances: ModifiedSectionAppearanceArgs[] = [];
        for (const [appearanceId, changes] of Object.entries(
            changesRef.current,
        )) {
            modifiedAppearances.push({
                id: parseInt(appearanceId),
                ...changes,
            });
        }

        if (modifiedAppearances.length > 0) {
            await SectionAppearance.updateSectionAppearances(
                modifiedAppearances,
            );
        }

        if (deletionsRef.current.length > 0) {
            await SectionAppearance.deleteSectionAppearances(
                deletionsRef.current,
            );
        }

        await fetchSectionAppearances();
    }

    // Handle canceling edits
    function handleCancel() {
        setLocalAppearances(sectionAppearances);
        clearChanges();
    }

    function handleDeleteAppearance(appearanceId: number) {
        deletionsRef.current.push(appearanceId);
        setLocalAppearances(
            localAppearances.filter(
                (appearance) => appearance.id !== appearanceId,
            ),
        );
    }

    function handleChange(value: any, attribute: string, appearanceId: number) {
        // Create an entry for the appearance if it doesn't exist
        if (!changesRef.current[appearanceId])
            changesRef.current[appearanceId] = {};

        // Record the change
        changesRef.current[appearanceId][attribute] = value;

        // Update local state to reflect the change
        setLocalAppearances((prevAppearances) =>
            prevAppearances.map((appearance) =>
                appearance.id === appearanceId
                    ? { ...appearance, [attribute]: value }
                    : appearance,
            ),
        );
    }

    const hasPendingChanges =
        Object.keys(changesRef.current).length > 0 ||
        deletionsRef.current.length > 0;

    function getDeletedSectionNames() {
        return deletionsRef.current
            .map((id) => {
                const sectionName = sectionAppearances.find(
                    (appearance) => appearance.id === id,
                )?.section;
                return sectionName || "Unknown";
            })
            .join(", ");
    }

    // Get available sections (sections without appearances)
    const availableSections = Object.values(SECTIONS)
        .map((section) => section.name)
        .filter(
            (sectionName) =>
                !sectionAppearances.some(
                    (appearance) => appearance.section === sectionName,
                ),
        )
        .sort();

    async function handleCreateNewAppearance(sectionName: string) {
        if (!sectionName) {
            return;
        }

        const newAppearance: NewSectionAppearanceArgs = {
            section: sectionName,
            fill_color: defaultFillColor,
            outline_color: defaultOutlineColor,
            shape_type: defaultShapeType,
        };

        try {
            await SectionAppearance.createSectionAppearances([newAppearance]);
            await fetchSectionAppearances();
            toast.success(`Added style for ${sectionName}`);
        } catch (error) {
            toast.error("Failed to create section appearance");
            console.error("Error creating section appearance:", error);
        }
    }

    return (
        <Form.Root
            onSubmit={(event) => {
                event.preventDefault();
            }}
            className="text-body text-text flex flex-col gap-16"
        >
            <div className="flex w-full items-center justify-between">
                {localAppearances &&
                    localAppearances.length > 0 &&
                    hasPendingChanges && (
                        <div className="flex w-full justify-between gap-8">
                            <Button
                                variant="secondary"
                                size="compact"
                                onClick={handleCancel}
                            >
                                Discard Changes
                            </Button>
                            {deletionsRef.current.length > 0 ? (
                                <AlertDialog>
                                    <AlertDialogTrigger>
                                        <Button variant="red" size="compact">
                                            Save Changes
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogTitle>
                                            Warning
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            You are about to delete these
                                            section styles:{" "}
                                            {getDeletedSectionNames()}. This can
                                            be undone with [Ctrl/Cmd+Z].
                                        </AlertDialogDescription>
                                        <div className="flex w-full justify-end gap-8">
                                            <AlertDialogCancel>
                                                <Button
                                                    variant="secondary"
                                                    size="compact"
                                                >
                                                    Cancel
                                                </Button>
                                            </AlertDialogCancel>
                                            <AlertDialogAction>
                                                <Button
                                                    variant="red"
                                                    size="compact"
                                                    onClick={handleSubmit}
                                                >
                                                    Delete
                                                </Button>
                                            </AlertDialogAction>
                                        </div>
                                    </AlertDialogContent>
                                </AlertDialog>
                            ) : hasPendingChanges ? (
                                <Button
                                    variant="primary"
                                    size="compact"
                                    onClick={handleSubmit}
                                >
                                    Save Changes
                                </Button>
                            ) : null}
                        </div>
                    )}
            </div>
            {hasPendingChanges && (
                <div className="bg-fg-2 text-text rounded-full py-4 text-center text-[14px]">
                    Below values may not be applied until after a refresh
                </div>
            )}

            <div className="flex h-fit w-full min-w-0 flex-col gap-16">
                {localAppearances && localAppearances.length > 0 ? (
                    <>
                        {localAppearances.map((appearance) => (
                            <div
                                key={appearance.id}
                                className="flex flex-col gap-12"
                            >
                                <div className="flex items-center justify-between">
                                    <h4 className="text-h4 font-medium">
                                        {appearance.section}
                                    </h4>
                                    <Button
                                        variant="red"
                                        size="compact"
                                        content="icon"
                                        onClick={() =>
                                            handleDeleteAppearance(
                                                appearance.id,
                                            )
                                        }
                                        tooltipText="Delete this section style"
                                        tooltipSide="left"
                                    >
                                        <Trash size={18} />
                                    </Button>
                                </div>

                                <ColorPicker
                                    label="Fill Color"
                                    tooltip="The fill color of the section marker"
                                    initialColor={appearance.fill_color}
                                    onChange={(color) => {
                                        handleChange(
                                            color,
                                            "fill_color",
                                            appearance.id,
                                        );
                                    }}
                                    defaultColor={{ r: 0, g: 0, b: 0, a: 1 }}
                                />

                                <ColorPicker
                                    label="Outline Color"
                                    tooltip="The outline-solid color of the section marker"
                                    initialColor={appearance.outline_color}
                                    onChange={(color) => {
                                        handleChange(
                                            color,
                                            "outline_color",
                                            appearance.id,
                                        );
                                    }}
                                    defaultColor={{
                                        r: 255,
                                        g: 255,
                                        b: 255,
                                        a: 1,
                                    }}
                                />

                                <div className={formFieldClassname}>
                                    <div className={labelClassname}>Shape</div>
                                    <Select
                                        value={appearance.shape_type}
                                        onValueChange={(value) =>
                                            handleChange(
                                                value,
                                                "shape_type",
                                                appearance.id,
                                            )
                                        }
                                    >
                                        <SelectTriggerText
                                            label="Shape"
                                            className={inputClassname}
                                        >
                                            {appearance.shape_type}
                                        </SelectTriggerText>
                                        <SelectContent>
                                            <SelectGroup>
                                                {shapeOptions.map((shape) => (
                                                    <SelectItem
                                                        key={shape}
                                                        value={shape}
                                                    >
                                                        {shape}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    <Tooltip.TooltipProvider>
                                        <Tooltip.Root>
                                            <Tooltip.Trigger type="button">
                                                <Info
                                                    size={18}
                                                    className="text-text/60"
                                                />
                                            </Tooltip.Trigger>
                                            <TooltipContents
                                                className="p-16"
                                                side="right"
                                            >
                                                The shape used to represent the
                                                section
                                            </TooltipContents>
                                        </Tooltip.Root>
                                    </Tooltip.TooltipProvider>
                                </div>

                                <div className="bg-stroke/30 h-px w-full"></div>
                            </div>
                        ))}
                    </>
                ) : (
                    <p className="text-body text-text/50">
                        No section styles defined yet. Add one to customize how
                        sections appear.
                    </p>
                )}

                <div className="mt-8 self-end">
                    <Select
                        value=""
                        onValueChange={handleCreateNewAppearance}
                        disabled={availableSections.length === 0}
                    >
                        <SelectTriggerText label="Add Section">
                            <div className="flex items-center gap-2">
                                <Plus size={16} />
                                <span>New Section Style</span>
                            </div>
                        </SelectTriggerText>
                        <SelectContent>
                            <SelectGroup>
                                {availableSections.map((sectionName) => (
                                    <SelectItem
                                        key={sectionName}
                                        value={sectionName}
                                    >
                                        {sectionName}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </Form.Root>
    );
}
