import { Container } from "@/components/ui/Container";
import { ChargingCalculatorClient } from "@/components/vehicles/ChargingCalculatorClient";
import { getChargingCostInputs } from "@/lib/vehicles/queries";

export default async function ChargingCalculatorPage() {
  const inputs = await getChargingCostInputs();

  return (
    <section className="px-4 pb-20 pt-16 sm:px-6 lg:px-8" dir="rtl">
      <Container>
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-right">
            <h1 className="text-4xl font-black text-[var(--voltjo-black)] sm:text-5xl">
              حاسبة الشحن
            </h1>
            <p className="mt-4 max-w-3xl text-base font-semibold leading-8 text-[var(--voltjo-muted)] sm:text-lg">
              احسب تكلفة شحن تقريبية داخل المتصفح حسب حجم البطارية ونطاق الشحن وسعر الكهرباء الذي تختاره.
            </p>
          </div>

          <ChargingCalculatorClient
            vehicles={inputs.vehicles}
            defaultElectricityPriceJodPerKwh={inputs.defaultElectricityPriceJodPerKwh}
            defaultEfficiencyPercent={inputs.defaultEfficiencyPercent}
          />
        </div>
      </Container>
    </section>
  );
}
