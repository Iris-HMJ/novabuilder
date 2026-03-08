// Registry index - imports and registers all component definitions
import { ComponentRegistry } from './ComponentRegistry';

// Data components
import { TableDefinition } from './components/data/TableComponent';
import { ListDefinition } from './components/data/ListComponent';
import { ChartDefinition } from './components/data/ChartComponent';
import { StatisticDefinition } from './components/data/StatisticComponent';

// Form components
import { TextInputDefinition } from './components/form/TextInputComponent';
import { NumberInputDefinition } from './components/form/NumberInputComponent';
import { SelectDefinition } from './components/form/SelectComponent';
import { DatePickerDefinition } from './components/form/DatePickerComponent';
import { FileUploadDefinition } from './components/form/FileUploadComponent';
import { RichTextDefinition } from './components/form/RichTextComponent';

// Layout components
import { ContainerDefinition } from './components/layout/ContainerComponent';
import { TabsDefinition } from './components/layout/TabsComponent';
import { ModalDefinition } from './components/layout/ModalComponent';

// Action components
import { ButtonDefinition } from './components/action/ButtonComponent';
import { ToggleDefinition } from './components/action/ToggleComponent';
import { CheckboxDefinition } from './components/action/CheckboxComponent';
import { SpinnerDefinition } from './components/action/SpinnerComponent';

// Media components
import { ImageDefinition } from './components/media/ImageComponent';
import { PDFViewerDefinition } from './components/media/PDFViewerComponent';

// Navigation components
import { SidebarDefinition } from './components/navigation/SidebarComponent';

// Create registry instance
const registry = new ComponentRegistry();

// Register all components
registry.register(TableDefinition);
registry.register(ListDefinition);
registry.register(ChartDefinition);
registry.register(StatisticDefinition);

registry.register(TextInputDefinition);
registry.register(NumberInputDefinition);
registry.register(SelectDefinition);
registry.register(DatePickerDefinition);
registry.register(FileUploadDefinition);
registry.register(RichTextDefinition);

registry.register(ContainerDefinition);
registry.register(TabsDefinition);
registry.register(ModalDefinition);

registry.register(ButtonDefinition);
registry.register(ToggleDefinition);
registry.register(CheckboxDefinition);
registry.register(SpinnerDefinition);

registry.register(ImageDefinition);
registry.register(PDFViewerDefinition);

registry.register(SidebarDefinition);

export { registry };
export { ComponentRegistry } from './ComponentRegistry';
export * from './types';
