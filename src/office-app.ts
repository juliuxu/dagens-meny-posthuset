import { z } from "zod";

const secrets = z
  .object({
    X_Officeapp_Device: z.string().nonempty(),
    X_Officeapp_Token: z.string().nonempty(),
  })
  .parse({
    X_Officeapp_Device: import.meta.env.X_Officeapp_Device,
    X_Officeapp_Token: import.meta.env.X_Officeapp_Token,
  });

const responseSchema = z.object({
  data: z
    .array(
      z.object({
        name: z.string(),
        availability: z.array(
          z
            .object({
              period_start: z.string(),
              period_end: z.string(),
              dishes: z.array(
                z
                  .object({
                    id: z.string(),
                    name: z.string(),
                    description: z.string().nullish(),
                    allergens: z.array(
                      z
                        .object({
                          name: z.string(),
                          containment: z.literal("CONTAINS").or(z.string()),
                        })
                        .passthrough()
                    ),
                    nutrients: z.array(
                      z.object({ name: z.string() }).passthrough()
                    ),
                    category: z.object({ name: z.string() }).passthrough(),
                  })
                  .passthrough()
              ),
            })
            .passthrough()
        ),
      })
    )
    .nonempty(),
});

const mocks = {
  empty: import("./mocks/empty.json"),
  friday: import("./mocks/friday.json"),
} as const;
const mockSchema = z.enum(Object.keys(mocks) as ["empty", "friday"]).nullable();
type Mock = z.infer<typeof mockSchema>;
export const parseMockKey = (mock: unknown) => mockSchema.parse(mock);

async function fetchDailyMenuJson() {
  const response = await fetch(
    "https://apiv2.getofficeapp.com/api/?action=integrations/dailymenu/zones/149/menus/",
    {
      headers: {
        Host: "apiv2.getofficeapp.com",
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Officeapp-Environment": "com.officeapp.officeapp",
        "X-Officeapp-Language": "en",
        "X-Officeapp-Token": secrets.X_Officeapp_Token,
        "Accept-Language": "en-GB,en;q=0.9",
        "Accept-Encoding": "gzip, deflate",
        "X-Officeapp-Office": "149",
        "User-Agent": "OfficeApp/3.17.16 (iPhone; iOS 16.6.0; Scale/2.00)",
        "X-Officeapp-Device": secrets.X_Officeapp_Device,
      },
    }
  );
  if (!response.ok) {
    throw new Error("non ok response");
  }
  return await response.json();
}

export async function getDailyMenu(mock: Mock) {
  let data: unknown;
  if (mock) {
    data = await mocks[mock];
  } else {
    data = await fetchDailyMenuJson();
  }
  return responseSchema.parse(data).data;
}
