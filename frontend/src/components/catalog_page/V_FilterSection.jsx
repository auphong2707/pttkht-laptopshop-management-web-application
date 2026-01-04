import {
  Typography,
  Button,
  Collapse,
  Checkbox,
  Divider,
  Slider,
  InputNumber,
} from "antd";
import { useEffect, useState, useCallback } from "react";
import styled from "styled-components";
import PropTypes from "prop-types";
import { debounce } from "lodash";

const { Text } = Typography;
const { Panel } = Collapse;

const FilterSection = ({
  brand,
  subBrands,
  pendingFilters,
  updatePendingFilters,
  clearFilters,
  applyFilters,
  collapseState,
  updateCollapseState,
}) => {
  const StyledCollapse = styled(Collapse)`
    .ant-collapse-header {
      font-weight: bold;
      font-size: 16px;
      text-align: left;
      display: flex;
      align-items: center;
      flex-direction: row-reverse;
    }
    .ant-collapse-content-box {
      padding-top: 0;
    }
    .ant-collapse-content {
      border: none;
      padding-top: 0;
    }
  `;

  const CheckboxFilter = ({ title, category, options }) => {
    const handleCheckboxChange = (value) => {
      updatePendingFilters({
        selectedFilters: {
          ...pendingFilters.selectedFilters,
          [category]: pendingFilters.selectedFilters[category].includes(value)
            ? pendingFilters.selectedFilters[category].filter(
                (item) => item !== value,
              )
            : [...pendingFilters.selectedFilters[category], value],
        },
      });
    };

    CheckboxFilter.propTypes = {
      title: PropTypes.string.isRequired,
      category: PropTypes.string.isRequired,
      options: PropTypes.arrayOf(
        PropTypes.shape({
          name: PropTypes.string.isRequired,
        }),
      ).isRequired,
    };

    return (
      <StyledCollapse
        defaultActiveKey={["1"]}
        ghost
        activeKey={collapseState[category] ? ["1"] : []}
        onChange={() => updateCollapseState(category)}
      >
        <Panel header={title} key="1" style={{}}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              width: "100%",
              height: "auto",
            }}
          >
            {options.map((option, index) => (
              <Checkbox
                key={index}
                checked={pendingFilters.selectedFilters[category].includes(
                  option.name,
                )}
                onChange={() => handleCheckboxChange(option.name)}
              >
                <Text style={{ fontSize: "14px" }}>{option.name}</Text>
              </Checkbox>
            ))}
          </div>
        </Panel>
      </StyledCollapse>
    );
  };

  const SliderFilter = ({
    title,
    min,
    max,
    step = 1,
    unit,
    value,
    onChange,
    category,
  }) => {
    SliderFilter.propTypes = {
      title: PropTypes.string.isRequired,
      min: PropTypes.number.isRequired,
      max: PropTypes.number.isRequired,
      step: PropTypes.number,
      unit: PropTypes.string.isRequired,
      value: PropTypes.arrayOf(PropTypes.number).isRequired,
      onChange: PropTypes.func.isRequired,
      category: PropTypes.string.isRequired,
    };
    const [minValue, setMinValue] = useState(value[0]);
    const [maxValue, setMaxValue] = useState(value[1]);

    // Sync external value changes (if value prop updates)
    useEffect(() => {
      setMinValue(value[0]);
      setMaxValue(value[1]);
    }, [value]);

    // Debounced callback for smooth updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedOnChange = useCallback(
      debounce((newValue) => onChange(newValue), 300),
      [],
    );

    // Handle input changes
    const handleMinChange = (val) => {
      const newMin = Math.max(min, Math.min(val || min, maxValue));
      setMinValue(newMin);
      debouncedOnChange([newMin, maxValue]);
    };

    const handleMaxChange = (val) => {
      const newMax = Math.min(max, Math.max(val || max, minValue));
      setMaxValue(newMax);
      debouncedOnChange([minValue, newMax]);
    };

    // Handle smooth slider updates
    const handleSliderChange = (newValue) => {
      setMinValue(newValue[0]);
      setMaxValue(newValue[1]);
      debouncedOnChange(newValue);
    };

    return (
      <StyledCollapse
        defaultActiveKey={["1"]}
        ghost
        activeKey={collapseState[category] ? ["1"] : []}
        onChange={() => updateCollapseState(category)}
      >
        <Panel header={title} key="1">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              width: "100%",
            }}
          >
            {/* Input Fields for Min and Max */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <InputNumber
                min={min}
                max={max}
                value={minValue}
                onChange={handleMinChange}
                formatter={(val) => `${val.toLocaleString()} ${unit}`}
                style={{ width: "40%" }}
              />
              <span>—</span>
              <InputNumber
                min={min}
                max={max}
                value={maxValue}
                onChange={handleMaxChange}
                formatter={(val) => `${val.toLocaleString()} ${unit}`}
                style={{ width: "40%" }}
              />
            </div>

            {/* Smooth Slider */}
            <Slider
              range
              min={min}
              max={max}
              step={step}
              value={[minValue, maxValue]}
              onChange={handleSliderChange}
            />
          </div>
        </Panel>
      </StyledCollapse>
    );
  };

  return (
    <div
      style={{
        width: 260,
        textAlign: "center",
        background: "#F5F7FF",
        paddingTop: 16,
        paddingBottom: 10,
      }}
    >
      {/* Title */}
      <Text strong style={{ fontSize: 20, display: "block" }}>
        Filters
      </Text>

      <br></br>

      <Button
        type="default"
        onClick={clearFilters}
        style={{
          width: "90%",
          height: 40,
          fontSize: 16,
          display: "block",
          margin: "0 auto",
        }}
      >
        Clear Filters
      </Button>

      <div style={{ margin: "0% 5%" }}>
        <Divider style={{ marginBottom: 0, marginRight: 5 }} />

        {/* Price Filter */}
        <SliderFilter
          title="Price"
          min={3000000}
          max={180000000}
          step={1000000}
          value={pendingFilters.priceRange}
          unit="đ"
          onChange={(value) => updatePendingFilters({ priceRange: value })}
          category="priceRange"
        />

        <Divider style={{ marginBottom: 0, marginTop: 3 }} />

        {/* Type Filter */}
        <CheckboxFilter
          title="Usage Type"
          category="usageType"
          options={[
            { name: "Gaming" },
            { name: "Business" },
            { name: "Ultrabook" },
            { name: "Workstation" },
            { name: "General"}
          ]}
          handleCheckboxChange={(value) =>
            updatePendingFilters({ type: value })
          }
        />
        <Divider style={{ marginBottom: 0, marginTop: 3 }} />

        {/* Sub-brand Filter */}
        <CheckboxFilter
          title="Sub-brand"
          category="subBrand"
          options={subBrands[brand].map((item) => ({ name: item }))}
          handleCheckboxChange={(value) =>
            updatePendingFilters({ subBrand: value })
          }
        />

        <Divider style={{ marginBottom: 0, marginTop: 3 }} />

        {/* Processor Filter */}
        <CheckboxFilter
          title="Processor"
          category="cpu"
          options={[
            { name: "AMD Ryzen 3" },
            { name: "AMD Ryzen 5" },
            { name: "AMD Ryzen 7" },
            { name: "AMD Ryzen 9" },
            { name: "Intel Core i3" },
            { name: "Intel Core i5" },
            { name: "Intel Core i7" },
            { name: "Intel Core i9" },
            { name: "Apple M1" },
            { name: "Apple M2" },
            { name: "Apple M3" },
            { name: "Apple M4" },
          ]}
        />

        <Divider style={{ marginBottom: 0, marginTop: 3 }} />

        {/* Graphics Card Filter */}
        <CheckboxFilter
          title="Graphics Card"
          category="vga"
          options={[
            { name: "NVIDIA MX" },
            { name: "NVIDIA GTX" },
            { name: "NVIDIA RTX 20 Series" },
            { name: "NVIDIA RTX 30 Series" },
            { name: "NVIDIA RTX 40 Series" },
            { name: "NVIDIA Quadro" },
            { name: "AMD Radeon RX 5000M" },
            { name: "AMD Radeon RX 6000M" },
            { name: "AMD Radeon RX 7000M" },
            { name: "AMD Radeon Pro" },
          ]}
          handleCheckboxChange={(value) => updatePendingFilters({ vga: value })}
        />

        <Divider style={{ marginBottom: 0, marginTop: 3 }} />

        {/* RAM Amount Filter */}
        <CheckboxFilter
          title="RAM Amount"
          category="ramAmount"
          options={[
            { name: "8 GB" },
            { name: "16 GB" },
            { name: "32 GB" },
            { name: "64 GB" },
          ]}
          handleCheckboxChange={(value) =>
            updatePendingFilters({ ramAmount: value })
          }
        />

        <Divider style={{ marginBottom: 0, marginTop: 3 }} />

        {/* Storage Amount Filter */}
        <CheckboxFilter
          title="Storage Amount"
          category="storageAmount"
          options={[{ name: "256 GB" }, { name: "512 GB" }, { name: "1 TB" }]}
          handleCheckboxChange={(value) =>
            updatePendingFilters({ storageAmount: value })
          }
        />

        <Divider style={{ marginBottom: 0, marginTop: 3 }} />

        {/* Screen Size Filter */}
        <CheckboxFilter
          title="Screen Size"
          category="screenSize"
          options={[
            { name: "13 inch" },
            { name: "14 inch" },
            { name: "15 inch" },
            { name: "16 inch" },
            { name: "17 inch" },
          ]}
          handleCheckboxChange={(value) =>
            updatePendingFilters({ screenSize: value })
          }
        />

        <Divider style={{ marginBottom: 0, marginTop: 3 }} />

        {/* Weight Filter */}
        <SliderFilter
          title="Weight"
          min={0.5}
          max={5}
          step={0.1}
          value={pendingFilters.weightRange}
          unit="kg"
          onChange={(value) => updatePendingFilters({ weightRange: value })}
          category="weightRange"
        />
      </div>

      <Button
        type="primary"
        style={{
          width: "90%",
          height: 40,
          fontSize: 18,
          display: "block",
          margin: "0 auto",
          borderRadius: 25,
          fontWeight: "bold",
        }}
        onClick={applyFilters}
      >
        Apply Filters
      </Button>
    </div>
  );
};
FilterSection.propTypes = {
  pendingFilters: PropTypes.shape({
    selectedFilters: PropTypes.object.isRequired,
    priceRange: PropTypes.arrayOf(PropTypes.number).isRequired,
    weightRange: PropTypes.arrayOf(PropTypes.number).isRequired,
  }).isRequired,
  brand: PropTypes.string.isRequired,
  subBrands: PropTypes.object.isRequired,
  updatePendingFilters: PropTypes.func.isRequired,
  clearFilters: PropTypes.func.isRequired,
  applyFilters: PropTypes.func.isRequired,
  collapseState: PropTypes.object.isRequired,
  updateCollapseState: PropTypes.func.isRequired,
};

export default FilterSection;
