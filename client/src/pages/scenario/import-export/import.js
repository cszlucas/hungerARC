import React, { useState, useContext } from "react";
import {
    ThemeProvider,
    CssBaseline,
    Container,
    Typography,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Box,
    Button
} from "@mui/material";
import { AppContext, defaultInfo } from "../../../context/appContext";
import { AuthContext } from "../../../context/authContext";
import EditIcon from "@mui/icons-material/Edit";
import theme from "../../../components/theme";
import Navbar from "../../../components/navbar";
import { useNavigate } from "react-router-dom";
import yaml from "js-yaml";
import axios from "axios";
import { ObjectId } from "bson";
// new ObjectId().toHexString();

const ImportBtn = () => {
    // const [ selectedScenario, setSelectedScenario] = useState(null); // Track selected scenario
    const { scenarioData, setScenarioData, setEditMode, setCurrScenario, setCurrInvestments, setCurrIncome, setCurrExpense, setCurrInvest, setCurrRebalance, setCurrInvestmentTypes } = useContext(AppContext);
    const { user } = useContext(AuthContext);

    function parseScenarioYAML(yamlObject) {
        const {
          name,
          maritalStatus,
          birthYears,
          lifeExpectancy,
          inflationAssumption,
          afterTaxContributionLimit,
          spendingStrategy,
          expenseWithdrawalStrategy,
          RMDStrategy,
          RothConversionOpt,
          RothConversionStart,
          RothConversionEnd,
          RothConversionStrategy,
          financialGoal,
          residenceState,
          investmentTypes,
          investments,
          eventSeries,
        } = yamlObject;
        
        //new ObjectId().toHexString();
        const investmentTypeMap = Object.fromEntries(investmentTypes.map(i => [i.name, new ObjectId().toHexString()]));
        const investmentMap = Object.fromEntries(investments.map(i => [i.id, new ObjectId().toHexString()]));
        const eventSeriesMap = Object.fromEntries(eventSeries.map(i => [i.name, new ObjectId().toHexString()]));

        const frontendInvestmentTypes = investmentTypes.map(t => ({
          _id: investmentTypeMap[t.name],
          name: t.name,
          description: t.description,
          expenseRatio: String(t.expenseRatio),
          taxability: t.taxability,
          annualReturn: {
            unit: t.returnAmtOrPct === "percent" ? "percentage" : "fixed",
            type: t.returnDistribution.type ,
            value: t.returnDistribution.value ?? "",
            mean: t.returnDistribution.mean ?? "",
            stdDev: t.returnDistribution.stdev ?? "",
          },
          annualIncome: {
            unit: t.incomeAmtOrPct === "percent" ? "percentage" : "fixed",
            type: t.incomeDistribution.type,
            value: t.incomeDistribution.value ?? "",
            mean: t.incomeDistribution.mean ?? "",
            stdDev: t.incomeDistribution.stdev ?? "",
          }
        }));
      
        const frontendInvestments = investments.map(inv => ({
          _id: investmentMap[inv.id],
          investmentType: investmentTypeMap[inv.investmentType],
          accountTaxStatus: inv.taxStatus,
          value: inv.value,
        }));
        
        function parseChange(e) {
          const dist = e.changeDistribution || {};
          return {
              type: e.changeAmtOrPct === "percent" ? "percentage" : "fixed",
              amount: dist.value ?? "",
              distribution: dist.type === "fixed" ? "none" : dist.type,
              mean: dist.mean ?? "",
              stdDev: dist.stdev ?? "",
              min: dist.lower ?? "",
              max: dist.upper ?? "",
          };
        }

        function parseStartYear(e) {
          const parsed = {
            type: e.type === "fixed" ? "fixedAmt" : e.type,
            value: e.value ?? null,
            mean: e.mean ?? null,
            stdDev: e.stdev ?? null,
            min: e.lower ?? null,
            max: e.upper ?? null,
          };

          if (e.type === "startWith") parsed.type = "same";
          if (e.type === "startAfter") parsed.type = "after";
          parsed.refer = eventSeriesMap[e.eventSeries] ?? null;

          return parsed;
        }

        const income = [], expense = [], invest = [], rebalance = [];
      
        for (const e of eventSeries) {
          const base = {
            _id: eventSeriesMap[e.name],
            eventSeriesName: e.name,
            startYear: parseStartYear(e.start),
            duration: {
              type: e.duration.type === "fixed" ? "fixedAmt" : e.duration.type,
              value: e.duration.value ?? null,
              mean: e.duration.mean ?? null,
              stdDev: e.duration.stdev ?? null,
              min: e.duration.lower ?? null,
              max: e.duration.upper ?? null,
            },
          };

          if (e.type === "income") {
            income.push({
              ...base,
              initialAmount: e.initialAmount,
              annualChange: parseChange(e),
              userPercentage: e.userFraction,
              inflationAdjustment: e.inflationAdjusted,
              isSocialSecurity: e.socialSecurity,
            });
          } else if (e.type === "expense") {
            expense.push({
              ...base,
              initialAmount: e.initialAmount,
              annualChange: parseChange(e),
              userPercentage: e.userFraction,
              inflationAdjustment: e.inflationAdjusted,
              isDiscretionary: e.discretionary,
            });
          } else {
            const allocationType = e.assetAllocation2 ? "glidePath" : "fixed";
            const frontEndPercentages = allocationType === "fixed" 
              ? [
                  Object.fromEntries(Object.entries(e.assetAllocation).map(([key, value]) => [investmentMap[key], value])), 
                  {}, 
                  {},
                  null
                ]
              : [
                  {},
                  Object.fromEntries(Object.entries(e.assetAllocation).map(([key, value]) => [investmentMap[key], value])), 
                  Object.fromEntries(Object.entries(e.assetAllocation2).map(([key, value]) => [investmentMap[key], value])),
                  frontendInvestments.find((i) => i._id === investmentMap[Object.keys(e.assetAllocation)[0]]).accountTaxStatus
                ];
            const frontEndAssetAllocations = {
              type: allocationType,
              fixedPercentages: frontEndPercentages[0],
              initialPercentages: frontEndPercentages[1],
              finalPercentages: frontEndPercentages[2],
            };

            if (e.type === "invest") {
              invest.push({
                ...base,
                maxCash: e.maxCash,
                assetAllocation: frontEndAssetAllocations,
              });
            } else if (e.type === "rebalance") {
              rebalance.push({
                ...base,
                taxStatus: frontEndPercentages[3], // not present in YAML
                assetAllocation: frontEndAssetAllocations,
              });
            } 
          }
        }
      
        return {
          investments: frontendInvestments,
          investmentTypes: frontendInvestmentTypes,
          income,
          expense,
          invest,
          rebalance,
          scenario: {
            _id: new ObjectId().toHexString(),
            name,
            filingStatus: maritalStatus === "couple" ? "married" : "single",
            birthYearUser: birthYears[0],
            birthYearSpouse: birthYears[1] ?? null,
            lifeExpectancy: {
              type: lifeExpectancy[0].type,
              fixedAge: lifeExpectancy[0].value ?? null,
              mean: lifeExpectancy[0].mean ?? null,
              stdDev: lifeExpectancy[0].stdev ?? null,
            },
            lifeExpectancySpouse: {
              type: lifeExpectancy[1]?.type ?? "fixed",
              fixedAge: lifeExpectancy[1]?.value ?? null,
              mean: lifeExpectancy[1]?.mean ?? null,
              stdDev: lifeExpectancy[1]?.stdev ?? null,
            },          
            setOfinvestmentTypes: frontendInvestmentTypes.map((i) => i._id),
            setOfinvestments: frontendInvestments.map((i) => i._id),
            incomeEventSeries: income.map((i) => i._id),
            expenseEventSeries: expense.map((i) => i._id),
            investEventSeries: invest.map((i) => i._id),
            rebalanceEventSeries: rebalance.map((i) => i._id),
            inflationAssumption: {
              type: inflationAssumption.type,
              fixedRate: inflationAssumption.value ?? null,
              mean: inflationAssumption.mean ?? null,
              stdDev: inflationAssumption.stdev ?? null,
              min: inflationAssumption.min ?? null,
              max: inflationAssumption.max ?? null,
            },
            irsLimit: afterTaxContributionLimit,
            spendingStrategy: spendingStrategy.map((n) => eventSeriesMap[n]),
            expenseWithdrawalStrategy: expenseWithdrawalStrategy.map((n) => investmentMap[n]),
            rmdStrategy: RMDStrategy.map((n) => investmentMap[n]),
            optimizerSettings: {
              enabled: RothConversionOpt,
              startYear: RothConversionStart,
              endYear: RothConversionEnd,
            },
            rothConversionStrategy: RothConversionStrategy.map((n) => investmentMap[n]),
            financialGoal,
            stateResident: residenceState,
          }
        };
    }

    const handleYAMLImportFile = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (ev) => {
          try {
            const raw = yaml.load(ev.target.result);
            const parsed = parseScenarioYAML(raw);

            console.log("✅ Parsed YAML:", parsed);
            const response = await axios.post(`http://localhost:8080/importScenario/user/${user._id}`, parsed);

            console.log(response.data);

            setScenarioData((prev) => [...(prev || []), parsed.scenario]);
            setCurrInvestments(parsed.investments);
            setCurrInvestmentTypes(parsed.investmentTypes);
            setCurrIncome(parsed.income);
            setCurrExpense(parsed.expense);
            setCurrInvest(parsed.invest);
            setCurrRebalance(parsed.rebalance);
          } catch (err) {
            console.error("❌ YAML import failed:", err);
          }
        };
        reader.readAsText(file);
    };

    return (<>
      <input
          type="file"
          accept=".yaml"
          id="yaml-upload"
          style={{ display: "none" }}
          onChange={handleYAMLImportFile}
          disabled={user.guest}
      />
      <label htmlFor="yaml-upload">
        <Button
            variant="contained"
            component="span"
            sx={{ marginRight: 2, textTransform: "none" }}
            disabled={user.guest}
        >
            Import
        </Button>
      </label>
    </>);
};

export default ImportBtn;
