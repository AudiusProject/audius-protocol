
import os
import pandas as pd

csv_path = os.path.abspath(os.path.join(os.getcwd(), '..', 'csv'))

def get_all_csvs():
    # Get the list of all files and directories
    dir_list = os.listdir(csv_path)
    print('Num files and directories in', csv_path, 'is', len(dir_list))
    return dir_list


def main():
    csvs = get_all_csvs()

    final_result = None
    dfs = [pd.read_csv('../csv/' + csv) for csv in csvs]
    final_result = pd.concat(dfs).groupby(final_result.TrackId).first()

    try: 
        final_result.pop('Unnamed: 0')
    except:
        pass
    
    try:
        final_result.pop('Unnamed: 0.1')
    except:
        pass

    try:
        final_result.pop('Unnamed: 0.2')
    except:
        pass

    final_result = final_result.sort_values(by=['TrackId'])
    # print(final_result)
    final_result.to_csv('../final_result.csv')

    ############################################

    final_result_read = pd.read_csv('../final_result.csv')
    # print(final_result_read)

    all_track_ids_read = pd.read_csv('../all_track_ids.csv').sort_values(by=['track_id'])
    # print(all_track_ids_read)

    # print(final_result_read[['TrackId']].compare(all_track_ids_read[['TrackId']]))
    # print(final_result_read['TrackId'].isnotin(all_track_ids_read['TrackId']).value_counts())

    thebads = all_track_ids_read[~all_track_ids_read['track_id'].isin(final_result_read['track_id'])].sort_values(by=['track_id'])
    thebads.to_csv('../thebads.csv', index=False, header=False)


if __name__ == '__main__':
    main()
