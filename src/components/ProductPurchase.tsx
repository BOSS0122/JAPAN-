"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { places } from "@/data/places";
import { pickupPointById, type Product } from "@/data/commerce";
import type { FulfillmentOption } from "@/lib/providers/types";
import { t as localized } from "@/lib/localized";
import { createOrderAction, quoteFulfillmentAction } from "@/actions";
import { useShortlist } from "./shortlist";
import { DemoNotice } from "./ui";

const areaOf = new Map(places.map((p) => [p.id, p.areaKey]));

export function ProductPurchase({ product }: { product: Product }) {
  const locale = useLocale();
  const t = useTranslations("shop");
  const tc = useTranslations("common");
  const tb = useTranslations("booking");
  const { ids, ready } = useShortlist();

  // Phase B only works because we already know where they're going.
  const areaKeys = useMemo(
    () => [...new Set(ids.map((id) => areaOf.get(id)).filter((k): k is string => Boolean(k)))],
    [ids],
  );

  const [options, setOptions] = useState<FulfillmentOption[] | null>(null);
  const [chosen, setChosen] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [hotel, setHotel] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    quoteFulfillmentAction(product.id, areaKeys).then((next) => {
      if (cancelled) return;
      setOptions(next);
      setChosen((current) => (next.some((o) => o.id === current) ? current : next[0]?.id ?? ""));
    });
    return () => {
      cancelled = true;
    };
  }, [product.id, areaKeys, ready]);

  const option = options?.find((o) => o.id === chosen) ?? null;
  const itemTotal = product.priceJpy * quantity;
  const total = itemTotal + (option?.feeJpy ?? 0);
  const needsCountry = option?.mode === "ship-international";
  const needsHotel = Boolean(option?.pickupPointId?.startsWith("hotel-"));
  const valid =
    option !== null &&
    name.trim().length > 1 &&
    /.+@.+\..+/.test(email) &&
    (!needsCountry || country.trim().length > 1) &&
    (!needsHotel || hotel.trim().length > 1);

  const shipOptions = options?.filter((o) => o.mode === "ship-international") ?? [];
  const pickupOptions = options?.filter((o) => o.mode === "pickup-in-japan") ?? [];
  const noneOnRoute = pickupOptions.length > 0 && !pickupOptions.some((o) => o.onRoute);

  function radio(o: FulfillmentOption) {
    const point = o.pickupPointId ? pickupPointById.get(o.pickupPointId) : null;
    const active = chosen === o.id;
    return (
      <label
        key={o.id}
        className={`flex cursor-pointer gap-3 rounded-xl border-2 p-3 transition ${
          active ? "border-grape bg-grape-soft" : "border-line bg-paper hover:border-grape"
        }`}
      >
        <input
          type="radio"
          name="fulfillment"
          className="mt-1 h-4 w-4 shrink-0 accent-[#7c4dff]"
          checked={active}
          onChange={() => setChosen(o.id)}
        />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-display text-sm font-extrabold text-ink">
              {point ? localized(point.name, locale) : t("shipInternational")}
            </span>
            {o.onRoute && (
              <span className="jq-chip bg-matcha-soft text-matcha">📍 {t("onRoute")}</span>
            )}
          </span>
          {point && (
            <span className="mt-0.5 block text-xs text-ink-soft">
              {localized(point.note, locale)}
            </span>
          )}
          <span className="mt-1 block text-xs font-bold text-ink-soft">
            {o.feeJpy === 0 ? t("free") : `¥${o.feeJpy.toLocaleString()}`}
            {" · "}
            {o.mode === "ship-international"
              ? t("etaShip", { days: o.etaDays })
              : t("etaPickup", { days: o.etaDays })}
          </span>
        </span>
      </label>
    );
  }

  return (
    <div className="jq-card space-y-5 p-5">
      <div>
        <h2 className="font-display text-lg font-extrabold text-ink">
          {t("chooseFulfillment")}
        </h2>
        <p className="text-xs text-ink-soft">{t("soldBy", { partner: product.partnerName })}</p>
      </div>

      {options === null ? (
        <p className="text-sm text-ink-soft">{tc("loading")}</p>
      ) : (
        <div className="space-y-4">
          {shipOptions.length > 0 && (
            <div className="space-y-2">
              <p className="jq-label mb-0">🌏 {t("shipInternational")}</p>
              {shipOptions.map(radio)}
            </div>
          )}

          {pickupOptions.length > 0 && (
            <div className="space-y-2">
              <p className="jq-label mb-0">🧳 {t("pickupInJapan")}</p>
              {noneOnRoute && (
                <p className="rounded-xl bg-cream px-3 py-2 text-xs text-ink-soft">
                  {t("noPickupOnRoute")}
                </p>
              )}
              {pickupOptions.map(radio)}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="jq-label" htmlFor="qty">
            {t("quantity")}
          </label>
          <select
            id="qty"
            className="jq-field"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        {needsCountry && (
          <div>
            <label className="jq-label" htmlFor="country">
              {t("destinationCountry")}
            </label>
            <input
              id="country"
              className="jq-field"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              autoComplete="country-name"
            />
          </div>
        )}
        {needsHotel && (
          <div>
            <label className="jq-label" htmlFor="hotel">
              {t("hotelName")}
            </label>
            <input
              id="hotel"
              className="jq-field"
              value={hotel}
              onChange={(e) => setHotel(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="space-y-3 border-t border-line pt-4">
        <p className="jq-label mb-0">{t("yourDetails")}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="jq-field"
            placeholder={tb("name")}
            aria-label={tb("name")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
          <input
            className="jq-field"
            type="email"
            placeholder={tb("email")}
            aria-label={tb("email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
      </div>

      <dl className="space-y-1.5 border-t border-line pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-soft">{t("itemTotal")}</dt>
          <dd className="font-bold text-ink">¥{itemTotal.toLocaleString()}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-soft">{t("fulfillmentFee")}</dt>
          <dd className="font-bold text-ink">
            {option && option.feeJpy === 0 ? t("free") : `¥${(option?.feeJpy ?? 0).toLocaleString()}`}
          </dd>
        </div>
        <div className="flex justify-between border-t border-line pt-2">
          <dt className="font-display font-extrabold text-ink">{t("orderTotal")}</dt>
          <dd className="font-display text-xl font-extrabold text-berry">
            ¥{total.toLocaleString()}
          </dd>
        </div>
      </dl>

      <DemoNotice>{t("payNote")}</DemoNotice>

      <button
        type="button"
        className="jq-btn jq-btn-accent w-full"
        disabled={!valid || pending}
        onClick={() =>
          startTransition(async () => {
            await createOrderAction({
              productId: product.id,
              quantity,
              optionId: chosen,
              areaKeys,
              name,
              email,
              destinationCountry: country,
              hotelName: hotel,
              locale,
            });
          })
        }
      >
        {pending ? tc("loading") : t("placeOrder")}
      </button>

      <p className="text-xs text-ink-soft">{t("commissionModel")}</p>
    </div>
  );
}
