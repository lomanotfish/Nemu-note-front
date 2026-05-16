"use client";

import {
  ColorArea,
  ColorPicker as ColorPickerHero,
  ColorSlider,
  ColorSwatch,
  Label,
} from "@heroui/react";

type Props = {
  value?: string;
  onChange?: (hex: string) => void;
};

export default function ColorPicker({ value = "#ffffff", onChange }: Props) {
  return (
    <ColorPickerHero
      defaultValue={value}
      onChange={(color) => onChange?.(color.toString("hex"))}
    >
      <ColorPickerHero.Trigger>
        <ColorSwatch className="h-6 w-6 cursor-pointer rounded-md shadow-sm border" size="sm" />
      </ColorPickerHero.Trigger>
      <ColorPickerHero.Popover>
        <ColorArea
          aria-label="Color area"
          className="max-w-sm"
          colorSpace="hsb"
          xChannel="saturation"
          yChannel="brightness"
        >
          <ColorArea.Thumb />
        </ColorArea>
        <ColorSlider channel="hue" className="gap-1 px-1" colorSpace="hsb">
          <Label>Hue</Label>
          <ColorSlider.Output className="text-muted" />
          <ColorSlider.Track>
            <ColorSlider.Thumb />
          </ColorSlider.Track>
        </ColorSlider>
      </ColorPickerHero.Popover>
    </ColorPickerHero>
  );
}
