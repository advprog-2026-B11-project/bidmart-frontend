export type EndTimePreset = "1day" | "3day" | "7day" | "custom";

export interface ListingFormData {
  title: string;
  description: string;
  categoryId: string;
  imageUrl: string;
  startingPrice: string;
  reservePrice: string;
  endTimePreset: EndTimePreset;
  endTime: string;
  auctionType: "ENGLISH";
}

export const INITIAL_FORM_DATA: ListingFormData = {
  title: "",
  description: "",
  categoryId: "",
  imageUrl: "",
  startingPrice: "",
  reservePrice: "",
  endTimePreset: "3day",
  endTime: "",
  auctionType: "ENGLISH",
};

export type FormErrors = Partial<Record<keyof ListingFormData, string>>;
