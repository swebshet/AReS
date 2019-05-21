import * as actions from 'src/store/actions/query.actions';
export interface QueryState {
  body: any;
}

const initialState: QueryState = {
  body: null
};

export function reducer(
  state = initialState,
  action: actions.QueryActions
): QueryState {
  switch (action.type) {
    case actions.QueryActionTypes.setQuery: {
      const body = action.payload;
      return {
        ...state,
        body
      };
    }
    default: {
      return state;
    }
  }
}

export const getQueryBody = (state: QueryState) => state.body;
