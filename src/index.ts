import { logger } from 'hono/logger';
import dayjs from 'dayjs';
import { RatesResponse, Bindings, Currency } from './types';
import currencyjs from 'currency.js';
import { z } from 'zod';
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

const CurrencyValues = Object.values(Currency) as [string, ...string[]];

const app = new Hono<{ Bindings: Bindings }>();
app.use(logger());

app.get(
  '/',
  zValidator(
    'query',
    z.object({
      date: z.string().optional(),
      base: z.enum(CurrencyValues).optional(),
    }),
  ),
  async (c) => {
    const { date, base } = c.req.valid('query');
    const OPENEXCHANGERATES_APP_ID = c.env.OPENEXCHANGERATES_APP_ID;

    const key = dayjs(date ? date : dayjs()).format('YYYY-MM-DD');

    let rates: RatesResponse['rates'] = {
      ...(Object.fromEntries(
        Object.values(Currency).map((currency) => [currency, 0]),
      ) as Record<Currency, number>),
    };

    console.log('Trying to get rates from cache');
    const cachedValue = await c.env.RATES.get(key);

    if (cachedValue) {
      console.log(`Cache hit for key ${key}`, cachedValue);
      rates = JSON.parse(cachedValue) as RatesResponse['rates'];
    } else {
      console.log('Cache miss for key:', key);
      rates = (
        (await (
          await fetch(
            `https://openexchangerates.org/api/historical/${key}.json?app_id=${OPENEXCHANGERATES_APP_ID}`,
          )
        ).json()) as RatesResponse
      ).rates;

      await c.env.RATES.put(key, JSON.stringify(rates));
    }

    if (base) {
      const baseRate = rates[base as Currency];
      rates = Object.fromEntries(
        Object.entries(rates).map(([currency, rate]) => [
          currency,
          currencyjs(rate, { precision: 10 }).divide(baseRate).value,
        ]),
      ) as RatesResponse['rates'];
    }

    return c.json(rates);
  },
);

export default app;
