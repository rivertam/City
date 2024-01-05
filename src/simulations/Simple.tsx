import * as React from 'react';
import { observer } from "mobx-react-lite";
import { City } from "../City/City";
import { CityGenerationParameters } from '../City/CityGenerator';

export const Simple = observer(({ size }: CityGenerationParameters) => {
    return <City size={size} />
});
